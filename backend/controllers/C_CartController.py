from .C_BaseController import C_BaseController
from sqlalchemy.orm import Session
from db.models import M_Cart, M_CartItem, M_Laptop
from typing import Optional


class C_CartController(C_BaseController):
    """Controller for shopping cart operations"""
    
    def __init__(self, db: Session):
        super().__init__()
        self.db = db
    
    def addToCart(self, userId: int, laptopId: int, qty: int) -> M_Cart:
        """Add item to user's cart"""
        # Get or create cart for user
        cart = self.db.query(M_Cart).filter(M_Cart.userId == userId).first()
        if not cart:
            cart = M_Cart(userId=userId, totalAmount=0.0)
            self.db.add(cart)
            self.db.flush()
        
        # Get laptop price
        laptop = self.db.query(M_Laptop).filter(M_Laptop.laptopId == laptopId).first()
        if not laptop:
            raise ValueError("Laptop not found")
        
        if not laptop.isInStock():
            raise ValueError("Laptop out of stock")
        
        # Add item to cart
        cart.addItem(laptopId, qty, int(laptop.price))
        cart.recalculateTotal()
        
        self.db.commit()
        self.db.refresh(cart)
        
        self.logAudit("cart_item_added", userId, laptopId)
        
        return cart
    
    def updateQuantity(self, userId: int, itemId: int, qty: int) -> M_Cart:
        """Update quantity of an item in cart"""
        cart = self.db.query(M_Cart).filter(M_Cart.userId == userId).first()
        if not cart:
            raise ValueError("Cart not found")
        
        # Find item
        item = next((item for item in cart.items if item.itemId == itemId), None)
        if not item:
            raise ValueError("Item not found in cart")
        
        item.updateQuantity(qty)
        cart.recalculateTotal()
        
        self.db.commit()
        self.db.refresh(cart)
        
        self.logAudit("cart_item_updated", userId, itemId)
        
        return cart
    
    def removeItem(self, userId: int, itemId: int) -> M_Cart:
        """Remove an item from cart"""
        cart = self.db.query(M_Cart).filter(M_Cart.userId == userId).first()
        if not cart:
            raise ValueError("Cart not found")
        
        cart.removeItem(itemId)
        
        self.db.commit()
        self.db.refresh(cart)
        
        self.logAudit("cart_item_removed", userId, itemId)
        
        return cart
    
    def queryCart(self, userId: int) -> Optional[M_Cart]:
        """Get user's current cart"""
        cart = self.db.query(M_Cart).filter(M_Cart.userId == userId).first()
        return cart
