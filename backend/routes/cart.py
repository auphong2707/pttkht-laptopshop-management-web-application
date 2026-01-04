from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from fastapi.security import HTTPBearer
from datetime import datetime
import json

from schemas.cart import *
from services.auth import get_current_user_id
from db.session import get_db
from controllers.C_CartController import C_CartController
from db.models import M_Cart, M_CartItem

security = HTTPBearer()
cart_router = APIRouter(prefix="/cart", tags=["cart"])


def serialize_cart(cart: M_Cart, db: Session) -> CartResponse:
    """Helper to serialize cart with current laptop prices"""
    cart.refreshPrices(db)
    
    items_response = []
    for item in cart.items:
        laptop = item.laptop
        laptop_image = None
        if laptop and laptop.productImages:
            images = json.loads(laptop.productImages) if isinstance(laptop.productImages, str) else laptop.productImages
            laptop_image = images[0] if images else None
        
        items_response.append(CartItemResponse(
            id=item.itemId,
            laptop_id=item.laptopId,
            laptop_name=laptop.modelName if laptop else "Unknown",
            laptop_image=laptop_image,
            quantity=item.quantity,
            unit_price=int(item.unitPrice),
            subtotal=int(item.subtotal)
        ))
    
    return CartResponse(
        cart_id=cart.cartId,
        total_amount=int(cart.totalAmount),
        updated_at=cart.updatedAt,
        items=items_response
    )


@cart_router.post("/add", response_model=CartResponse)
def add_to_cart(
    item: CartItemAdd,
    uid: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Add item to cart"""
    try:
        controller = C_CartController(db)
        cart = controller.addToCart(uid, item.laptop_id, item.quantity)
        return serialize_cart(cart, db)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@cart_router.get("/view", response_model=CartResponse)
def view_cart(
    uid: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get user's cart"""
    controller = C_CartController(db)
    cart = controller.queryCart(uid)
    
    if not cart:
        # Return empty cart
        return CartResponse(
            cart_id=0,
            total_amount=0.0,
            updated_at=datetime.utcnow(),
            items=[]
        )
    
    return serialize_cart(cart, db)


@cart_router.put("/update", response_model=CartResponse)
def update_cart_item(
    item: CartItemUpdate,
    uid: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Update cart item quantity"""
    controller = C_CartController(db)
    cart = controller.queryCart(uid)
    
    if not cart:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart not found"
        )
    
    # Find the item
    cart_item = None
    for ci in cart.items:
        if ci.laptopId == item.laptop_id:
            cart_item = ci
            break
    
    if not cart_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Laptop ID {item.laptop_id} not found in cart"
        )
    
    try:
        if item.new_quantity == 0:
            # Remove item
            cart = controller.removeItem(uid, cart_item.itemId)
        else:
            # Update quantity
            cart = controller.updateQuantity(uid, cart_item.itemId, item.new_quantity)
        
        return serialize_cart(cart, db)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@cart_router.delete("/remove/{laptop_id}", response_model=CartResponse)
def remove_from_cart(
    laptop_id: int,
    uid: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Remove specific item from cart"""
    controller = C_CartController(db)
    cart = controller.queryCart(uid)
    
    if not cart:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart not found"
        )
    
    # Find the item
    cart_item = None
    for ci in cart.items:
        if ci.laptopId == laptop_id:
            cart_item = ci
            break
    
    if not cart_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Laptop ID {laptop_id} not found in cart"
        )
    
    try:
        cart = controller.removeItem(uid, cart_item.itemId)
        return serialize_cart(cart, db)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@cart_router.delete("/clear", response_model=dict)
def clear_cart(
    uid: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Clear all items from the cart"""
    cart = db.query(M_Cart).filter(M_Cart.userId == uid).first()
    
    if cart:
        db.delete(cart)
        db.commit()
    
    return {"message": "Cart cleared successfully"}
