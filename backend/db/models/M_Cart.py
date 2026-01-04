from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    DECIMAL,
    TIMESTAMP,
    func,
)
from sqlalchemy.orm import relationship
from .base import Base


class M_Cart(Base):
    __tablename__ = "carts"

    # Map camelCase attributes to snake_case database columns
    cartId = Column("id", Integer, primary_key=True, index=True, autoincrement=True)
    userId = Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    totalAmount = Column("total_amount", Integer, nullable=False, default=0)
    updatedAt = Column("updated_at", TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("M_User", back_populates="carts")
    items = relationship("M_CartItem", back_populates="cart", cascade="all, delete-orphan")

    def addItem(self, laptopId: int, qty: int, unitPrice: int) -> "M_CartItem":
        """Add an item to the cart or update quantity if it exists"""
        # Check if item already exists
        existing_item = None
        for item in self.items:
            if item.laptopId == laptopId:
                existing_item = item
                break
        
        if existing_item:
            existing_item.updateQuantity(existing_item.quantity + qty)
            return existing_item
        else:
            new_item = M_CartItem(
                laptopId=laptopId,
                quantity=qty,
                unitPrice=unitPrice
            )
            self.items.append(new_item)
            return new_item

    def removeItem(self, itemId: int) -> None:
        """Remove an item from the cart"""
        self.items = [item for item in self.items if item.itemId != itemId]
        self.recalculateTotal()

    def recalculateTotal(self) -> None:
        """Recalculate the total amount of all items in cart"""
        total = sum(item.computeSubtotal() for item in self.items)
        self.totalAmount = int(total)

    def refreshPrices(self, db_session) -> None:
        """Update all cart item prices with current laptop prices"""
        from .M_Laptop import M_Laptop
        for item in self.items:
            laptop = db_session.query(M_Laptop).filter(M_Laptop.laptopId == item.laptopId).first()
            if laptop and laptop.price:
                item.unitPrice = int(laptop.price)
                item.subtotal = item.computeSubtotal()
        self.recalculateTotal()

    def getItems(self):
        """Get all items in the cart"""
        return self.items


class M_CartItem(Base):
    __tablename__ = "cart_items"

    # Map camelCase attributes to snake_case database columns
    itemId = Column("id", Integer, primary_key=True, autoincrement=True)
    cartId = Column("cart_id", Integer, ForeignKey("carts.id", ondelete="CASCADE"), nullable=False, index=True)
    laptopId = Column("laptop_id", Integer, ForeignKey("laptops.id", ondelete="CASCADE"), nullable=False)
    quantity = Column("quantity", Integer, nullable=False)
    unitPrice = Column("unit_price", Integer, nullable=False)
    subtotal = Column("subtotal", Integer, nullable=False, default=0)

    # Relationships
    cart = relationship("M_Cart", back_populates="items")
    laptop = relationship("M_Laptop", back_populates="cartItems")

    def updateQuantity(self, newQty: int) -> None:
        """Update the quantity of this cart item"""
        self.quantity = newQty
        self.subtotal = self.computeSubtotal()

    def computeSubtotal(self) -> int:
        """Compute the subtotal for this cart item"""
        return int(self.quantity * self.unitPrice)
