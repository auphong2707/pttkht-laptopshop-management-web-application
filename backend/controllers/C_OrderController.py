from .C_BaseController import C_BaseController
from sqlalchemy.orm import Session
from db.models import M_Order, M_OrderItem, M_Cart, M_Laptop
from typing import List, Optional


class C_OrderController(C_BaseController):
    """Controller for order operations"""
    
    def __init__(self, db: Session):
        super().__init__()
        self.db = db
    
    def placeOrder(self, userId: int, cartId: int, shippingAddress: str, 
                  paymentMethod: str, firstName: str, lastName: str,
                  userEmail: str, phoneNumber: str) -> int:
        """Place a new order from cart"""
        # Get cart
        cart = self.db.query(M_Cart).filter(
            M_Cart.cartId == cartId,
            M_Cart.userId == userId
        ).first()
        
        if not cart or not cart.items:
            raise ValueError("Cart is empty")
        
        # Create order
        new_order = M_Order(
            userId=userId,
            shippingAddress=shippingAddress,
            totalAmount=cart.totalAmount,
            status="pending",
            paymentMethod=paymentMethod,
            firstName=firstName,
            lastName=lastName,
            userEmail=userEmail,
            phoneNumber=phoneNumber
        )
        
        self.db.add(new_order)
        self.db.flush()
        
        # Create order items from cart items
        for cart_item in cart.items:
            order_item = M_OrderItem(
                orderId=new_order.orderId,
                laptopId=cart_item.laptopId,
                quantity=cart_item.quantity,
                unitPrice=cart_item.unitPrice,
                subtotal=cart_item.computeSubtotal()
            )
            self.db.add(order_item)
            
            # Update laptop stock
            laptop = self.db.query(M_Laptop).filter(M_Laptop.laptopId == cart_item.laptopId).first()
            if laptop:
                laptop.adjustStock(-cart_item.quantity)
        
        # Clear cart
        self.db.delete(cart)
        
        self.db.commit()
        self.db.refresh(new_order)
        
        self.logAudit("order_placed", userId, new_order.orderId)
        
        return new_order.orderId
    
    def viewOrders(self, userId: int) -> List[M_Order]:
        """View all orders for a user"""
        orders = self.db.query(M_Order).filter(
            M_Order.userId == userId
        ).order_by(M_Order.createdAt.desc()).all()
        return orders
    
    def getOrderDetail(self, orderId: int) -> Optional[M_Order]:
        """Get detailed information about an order"""
        order = self.db.query(M_Order).filter(
            M_Order.orderId == orderId
        ).first()
        return order
    
    def updateOrderStatus(self, orderId: int, newStatus: str, updatedBy: int) -> M_Order:
        """Update the status of an order"""
        order = self.db.query(M_Order).filter(M_Order.orderId == orderId).first()
        if not order:
            raise ValueError("Order not found")
        
        order.updateStatus(newStatus, updatedBy)
        self.db.commit()
        self.db.refresh(order)
        
        self.logAudit("order_status_updated", updatedBy, orderId)
        
        return order
