from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from decimal import Decimal, InvalidOperation
from typing import List, Optional
from pydantic import BaseModel

from db.models import M_Laptop, M_Order, M_OrderItem, M_User, M_RefundTicket, M_Cart
from db.session import get_db
from schemas.orders import (
    OrderResponse,
    UpdateStatus,
)
from datetime import datetime

from services.auth import get_current_user_id, get_current_admin_user, get_current_user
from controllers.C_OrderController import C_OrderController

# --- Create Router ---
orders_router = APIRouter(prefix="/orders", tags=["orders"])


async def require_admin_role(user: M_User = Depends(get_current_admin_user)):
    """Verify the current user is an admin"""
    return user.userId


class CreateOrderRequest(BaseModel):
    first_name: str
    last_name: str
    user_email: str
    shipping_address: str
    phone_number: str
    payment_method: str


@orders_router.post("", response_model=OrderResponse)
def create_order_from_cart(
    order_data: CreateOrderRequest,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Creates a new order from the user's cart.
    """
    # Get cart from SQL
    cart = db.query(M_Cart).filter(M_Cart.userId == user_id).first()
    
    if not cart or not cart.items:
        raise HTTPException(status_code=400, detail="Cart is empty.")

    # Refresh prices before creating order
    cart.refreshPrices(db)
    
    # --- Process Cart Items & Validate Stock ---
    order_total_price = 0
    items_to_create = []
    laptops_to_update = {}
    
    try:
        product_ids = [item.laptopId for item in cart.items]
        
        stmt = select(M_Laptop).where(M_Laptop.laptopId.in_(product_ids))
        laptops_in_db = db.scalars(stmt).all()
        laptops_map = {laptop.laptopId: laptop for laptop in laptops_in_db}

        for cart_item in cart.items:
            laptop = laptops_map.get(cart_item.laptopId)
            if not laptop:
                raise HTTPException(
                    status_code=404, detail=f"Product ID {cart_item.laptopId} not found."
                )

            if laptop.stockQty < cart_item.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for {laptop.modelName} (ID: {cart_item.laptopId}).",
                )

            sale_price = laptop.price
            if sale_price is None:
                raise HTTPException(
                    status_code=500, detail=f"Missing price for product ID {cart_item.laptopId}"
                )

            item_subtotal_int = sale_price * cart_item.quantity
            order_total_price += item_subtotal_int

            items_to_create.append(
                {
                    "product_id": cart_item.laptopId,
                    "quantity": cart_item.quantity,
                    "price_at_purchase": sale_price,
                }
            )
            laptops_to_update[cart_item.laptopId] = cart_item.quantity

        # Add shipping cost
        shipping_cost = 50000  # 50,000 shipping cost
        order_total_price += shipping_cost

        # --- Database Transaction: Create Order, Items, Update Stock ---
        try:
            new_order = M_Order(
                userId=user_id,
                totalAmount=order_total_price,
                status="pending",
                firstName=order_data.first_name,
                lastName=order_data.last_name,
                userEmail=order_data.user_email,
                shippingAddress=order_data.shipping_address,
                phoneNumber=order_data.phone_number,
                paymentMethod=order_data.payment_method,
            )
            db.add(new_order)
            db.flush()

            order_items_obj_list = []
            for item_data in items_to_create:
                order_item = M_OrderItem(
                    laptopId=item_data["product_id"],
                    quantity=item_data["quantity"],
                    unitPrice=item_data["price_at_purchase"],
                )
                # Associate item with order - SQLAlchemy handles FK assignment
                order_item.order = new_order
                db.add(order_item)
                order_items_obj_list.append(order_item)

            # Update Laptop Stock
            for laptop_id, quantity_to_decrement in laptops_to_update.items():
                laptop_to_update = laptops_map.get(laptop_id)
                if laptop_to_update:
                    laptop_to_update.stockQty -= quantity_to_decrement
                else:
                    raise IntegrityError(
                        f"Laptop {laptop_id} missing in transaction.",
                        params=None,
                        orig=None,
                    )

            # Clear cart after successful order (within same transaction)
            db.delete(cart)

            # Now commit everything
            db.commit()
            # Manually assign items list if backref doesn't auto-populate immediately for response
            new_order.items = order_items_obj_list

        except (SQLAlchemyError, IntegrityError) as e:
            db.rollback()
            print(f"Database error during order creation: {e}")

            if "violates unique constraint" in str(e) and "orders_pkey" in str(e):
                detail_msg = "Failed to save order due to duplicate ID. Sequence might be out of sync."
            else:
                detail_msg = f"Failed to save order to database: {e}"

            raise HTTPException(status_code=500, detail=detail_msg)

        # --- Return Response ---
        db.refresh(new_order)

        for item in new_order.items:
            db.refresh(item)

        # Return properly formatted response matching OrderResponse schema
        return OrderResponse(
            id=new_order.orderId,
            user_id=str(new_order.userId),
            total_price=int(new_order.totalAmount),
            status=new_order.status,
            created_at=new_order.createdAt,
            updated_at=new_order.updatedAt,
            first_name=new_order.firstName,
            last_name=new_order.lastName,
            user_email=new_order.userEmail,
            shipping_address=new_order.shippingAddress,
            phone_number=new_order.phoneNumber,
            payment_method=new_order.paymentMethod,
            items=[
                {
                    "product_id": item.laptopId,
                    "quantity": item.quantity,
                    "price_at_purchase": int(item.unitPrice),
                }
                for item in new_order.items
            ]
        )

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Unexpected error during order creation: {e}")
        import traceback

        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"An unexpected error occurred: {e}"
        )


class PaginatedOrdersResponse(BaseModel):
    total_count: int
    page: int
    limit: int
    orders: List[OrderResponse]


@orders_router.get("", response_model=PaginatedOrdersResponse)
def get_my_orders(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Retrieves a paginated list of orders for the currently authenticated user
    from the PostgreSQL database.
    """
    controller = C_OrderController(db)
    offset = (page - 1) * limit

    try:
        # Use controller to view orders
        all_orders = controller.viewOrders(user_id)
        
        # Get total count for pagination
        total_count = len(all_orders)

        # Apply pagination manually
        orders = all_orders[offset:offset + limit]

        # Convert SQLAlchemy models to OrderResponse format
        formatted_orders = [
            OrderResponse(
                id=order.orderId,
                user_id=str(order.userId),
                total_price=int(order.totalAmount),
                status=order.status,
                created_at=order.createdAt,
                updated_at=order.updatedAt,
                first_name=order.firstName,
                last_name=order.lastName,
                user_email=order.userEmail,
                shipping_address=order.shippingAddress,
                phone_number=order.phoneNumber,
                payment_method=order.paymentMethod,
                items=[
                    {
                        "product_id": item.laptopId,
                        "quantity": item.quantity,
                        "price_at_purchase": int(item.unitPrice),
                    }
                    for item in order.items
                ],
                refund_ticket={
                    "id": order.refundTickets[0].ticketId,
                    "status": order.refundTickets[0].status.value,
                    "reason": order.refundTickets[0].reason,
                    "admin_comments": order.refundTickets[0].adminComments,
                    "created_at": order.refundTickets[0].createdAt.isoformat() if order.refundTickets[0].createdAt else None,
                    "resolved_at": order.refundTickets[0].resolvedAt.isoformat() if order.refundTickets[0].resolvedAt else None,
                } if order.refundTickets else None
            )
            for order in orders
        ]

        return PaginatedOrdersResponse(
            total_count=total_count, page=page, limit=limit, orders=formatted_orders
        )
    except SQLAlchemyError as e:
        print(f"Database error fetching user orders: {e}")
        raise HTTPException(status_code=500, detail="Could not retrieve orders.")


@orders_router.get("/{order_id}", response_model=OrderResponse)
def get_my_single_M_Order(
    order_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Fetches a single order by authenticated user ID.
    """
    controller = C_OrderController(db)
    
    try:
        # Use controller to get order detail
        order = controller.getOrderDetail(order_id)
        
        # Verify order belongs to user
        if not order or order.userId != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found or access denied.",
            )
    except SQLAlchemyError as e:
        print(f"Database error fetching single order: {e}")
        raise HTTPException(status_code=500, detail="Could not retrieve order details.")
    
    # Convert SQLAlchemy model to OrderResponse format
    return OrderResponse(
        id=order.orderId,
        user_id=str(order.userId),
        total_price=int(order.totalAmount),
        status=order.status,
        created_at=order.createdAt,
        updated_at=order.updatedAt,
        first_name=order.firstName,
        last_name=order.lastName,
        user_email=order.userEmail,
        shipping_address=order.shippingAddress,
        phone_number=order.phoneNumber,
        payment_method=order.paymentMethod,
        items=[
            {
                "product_id": item.laptopId,
                "quantity": item.quantity,
                "price_at_purchase": int(item.unitPrice),
            }
            for item in order.items
        ]
    )


@orders_router.patch("/{order_id}/cancel", response_model=OrderResponse)
def cancel_my_M_Order(
    order_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Allows the currently authenticated user to cancel their own order,
    if it is in a cancellable state (e.g., 'pending').
    """
    controller = C_OrderController(db)
    
    try:
        # Get order using controller
        order = controller.getOrderDetail(order_id)

        if not order or order.userId != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found or access denied.",
            )

        cancellable_statuses = ["pending", "processing"]

        if order.status not in cancellable_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Order cannot be cancelled. Current status: {order.status}",
            )

        # --- Restore Stock ---
        order_items_to_restore = (
            db.query(M_OrderItem).filter(M_OrderItem.order_id == order_id).all()
        )
        for item in order_items_to_restore:
            laptop = (
                db.query(M_Laptop)
                .filter(M_Laptop.laptopId == item.laptopId)
                .with_for_update()
                .first()
            )
            if laptop:
                laptop.stockQty += item.quantity
            else:
                # Log warning: Product might have been deleted?
                print(
                    f"Warning: Product ID {item.product_id} not found while restoring stock for cancelled order {order_id}"
                )

        # Use controller to update order status
        order = controller.updateOrderStatus(order_id, "cancelled", user_id)
        db.refresh(order)
        
        # Convert SQLAlchemy model to OrderResponse format
        return OrderResponse(
            id=order.orderId,
            user_id=str(order.userId),
            total_price=int(order.totalAmount),
            status=order.status,
            created_at=order.createdAt,
            updated_at=order.updatedAt,
            first_name=order.firstName,
            last_name=order.lastName,
            user_email=order.userEmail,
            shipping_address=order.shippingAddress,
            phone_number=order.phoneNumber,
            payment_method=order.paymentMethod,
            items=[
                {
                    "product_id": item.laptopId,
                    "quantity": item.quantity,
                    "price_at_purchase": int(item.unitPrice),
                }
                for item in order.items
            ]
        )

    except SQLAlchemyError as e:
        db.rollback()
        print(f"Database error cancelling order: {e}")
        raise HTTPException(
            status_code=500, detail="Could not cancel order due to a database error."
        )
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        print(f"Unexpected error cancelling order: {e}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while cancelling the M_Order.",
        )


# == Admin operation == #


@orders_router.get(
    "/admin/list",
    # Response model will now be dynamic
    # response_model=Union[PaginatedOrdersResponse, List[OrderResponse]], # More complex for auto-docs
    dependencies=[Depends(require_admin_role)],
)
def admin_get_all_orders(
    page: int = Query(1, ge=1, description="Page number (ignored if get_all=true)"),
    limit: int = Query(
        20, ge=1, le=100, description="Items per page (ignored if get_all=true)"
    ),
    get_all: bool = Query(
        False, description="Set to true to retrieve all orders without pagination"
    ),
    status_filter: Optional[str] = Query(
        None, alias="status", description="Filter by order status"
    ),
    email_filter: Optional[str] = Query(
        None, alias="user_email", description="Filter by user email"
    ),
    phone_filter: Optional[str] = Query(
        None, alias="phone_number", description="Filter by phone number"
    ),
    payment_method_filter: Optional[str] = Query(
        None, alias="payment_method", description="Filter by payment method"
    ),
    start_date: Optional[datetime] = Query(
        None, description="Filter orders created on or after this date (ISO Format)"
    ),
    end_date: Optional[datetime] = Query(
        None, description="Filter orders created on or before this date (ISO Format)"
    ),
    db: Session = Depends(get_db),
):
    print(
        f"Admin fetching all orders with filters: page={page}, limit={limit}, get_all={get_all}, status_filter={status_filter}, email_filter={email_filter}, phone_filter={phone_filter}, payment_method_filter={payment_method_filter}, start_date={start_date}, end_date={end_date}"
    )
    """
    [Admin] Retrieves a list of all orders, with optional filters.
    Supports pagination by default, or can retrieve all orders if 'get_all=true'.
    Requires admin privileges.
    """
    try:
        query = db.query(M_Order).options(joinedload(M_Order.items))  # Eager load items

        # Apply filters
        if status_filter:
            query = query.filter(M_Order.status == status_filter)
        if email_filter:
            query = query.filter(M_Order.userEmail.ilike(f"%{email_filter}%"))
        if phone_filter:
            query = query.filter(M_Order.phoneNumber.ilike(f"%{phone_filter}%"))
        if payment_method_filter:
            query = query.filter(M_Order.paymentMethod == payment_method_filter)
        if start_date:
            query = query.filter(M_Order.createdAt >= start_date)
        if end_date:
            query = query.filter(M_Order.createdAt <= end_date)

        # Order the results
        query = query.order_by(M_Order.createdAt.desc())

        if get_all:
            # Retrieve all matching orders
            orders = query.all()
            return orders  # Returns List[OrderResponse] effectively
        else:
            # Apply pagination
            offset = (page - 1) * limit
            total_count = query.count()  # Count after filtering but before pagination
            orders = query.offset(offset).limit(limit).all()

            return PaginatedOrdersResponse(
                total_count=total_count, page=page, limit=limit, orders=orders
            )

    except SQLAlchemyError as e:
        print(f"Database error fetching all orders for admin: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not retrieve orders.",
        )
    except Exception as e:  # Catch any other unexpected errors
        print(f"Unexpected error in admin_get_all_orders: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred.",
        )


@orders_router.get(
    "/admin/list/all",
    response_model=List[OrderResponse],
    dependencies=[Depends(require_admin_role)],
)
def admin_get_all_orders_unpaginated(
    status_filter: Optional[str] = Query(
        None, alias="status", description="Filter by order status"
    ),
    user_id_filter: Optional[int] = Query(
        None, alias="userId", description="Filter by User ID"
    ),
    start_date: Optional[datetime] = Query(
        None, description="Filter orders created on or after this date (ISO Format)"
    ),
    end_date: Optional[datetime] = Query(
        None, description="Filter orders created on or before this date (ISO Format)"
    ),
    db: Session = Depends(get_db),
):
    """
    [Admin] Retrieves ALL orders, with optional filters, without pagination.
    Requires admin privileges.
    """
    try:
        query = db.query(M_Order).options(joinedload(M_Order.items))  # Eager load items

        # Apply filters
        if status_filter:
            query = query.filter(M_Order.status == status_filter)
        if user_id_filter:
            query = query.filter(M_Order.userId == user_id_filter)
        if start_date:
            query = query.filter(M_Order.createdAt >= start_date)
        if end_date:
            query = query.filter(M_Order.createdAt <= end_date)

        # Order the results but NO offset or limit
        orders = query.order_by(M_Order.createdAt.desc()).all()

        return orders  # Returns List[OrderResponse]
    except SQLAlchemyError as e:
        print(f"Database error fetching all orders for admin (unpaginated): {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not retrieve orders.",
        )
    except Exception as e:
        print(f"Unexpected error in admin_get_all_orders_unpaginated: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred.",
        )


@orders_router.patch(
    "/admin/{order_id}/status",
    response_model=OrderResponse,
    dependencies=[Depends(require_admin_role)],
)
def admin_update_order_status(
    order_id: int, 
    status_data: UpdateStatus, 
    db: Session = Depends(get_db),
    admin_id: int = Depends(require_admin_role)
):
    """
    [Admin] Updates the status of any specific M_Order.
    Requires admin privileges.
    """
    controller = C_OrderController(db)

    allowed_statuses = [
        "pending",
        "processing",
        "shipping",
        "delivered",
        "cancelled",
        "refunded",
    ]
    if status_data.status not in allowed_statuses:
        raise HTTPException(
            status_code=400, detail=f"Invalid status value: {status_data.status}"
        )

    try:
        # Use controller to update order status
        order = controller.updateOrderStatus(order_id, status_data.status, admin_id)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e)
        )
    except SQLAlchemyError as e:
        db.rollback()
        print(f"Database error updating order status (Admin): {e}")
        raise HTTPException(status_code=500, detail="Could not update order status.")

    return order


@orders_router.delete(
    "/admin/{order_id}",
    dependencies=[Depends(require_admin_role)],
)
def admin_delete_M_Order(order_id: int, db: Session = Depends(get_db)):
    """
    [Admin] Permanently deletes a specific M_Order.
    Requires admin privileges.
    """
    try:
        order = db.query(M_Order).filter(M_Order.orderId == order_id).first()
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Order not found"
            )

        db.delete(order)
        db.commit()

    except SQLAlchemyError as e:
        db.rollback()
        print(f"Database error deleting order (Admin): {e}")
        raise HTTPException(status_code=500, detail="Could not delete M_Order.")

    return {
        "message": "Order removed successfully",
        "laptop_id": order_id,
    }
