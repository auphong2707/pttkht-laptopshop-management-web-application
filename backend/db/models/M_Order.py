from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    String,
    DECIMAL,
    TIMESTAMP,
    func,
    Text,
)
from sqlalchemy.orm import relationship
from .base import Base


class M_Order(Base):
    __tablename__ = "orders"

    # Map camelCase attributes to snake_case database columns
    orderId = Column("id", Integer, primary_key=True, index=True, autoincrement=True)
    userId = Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    shippingAddress = Column("shipping_address", Text, nullable=True)
    totalAmount = Column("total_price", DECIMAL(10, 2), nullable=False)
    status = Column("status", String(50), nullable=False, default="pending")
    createdAt = Column("created_at", TIMESTAMP(timezone=True), server_default=func.now())
    updatedAt = Column("updated_at", TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    # Additional fields
    firstName = Column("first_name", Text, nullable=True)
    lastName = Column("last_name", Text, nullable=True)
    userEmail = Column("user_email", Text, nullable=True)
    phoneNumber = Column("phone_number", Text, nullable=True)
    paymentMethod = Column("payment_method", String(50), nullable=False)

    # Relationships
    items = relationship("M_OrderItem", back_populates="order", cascade="all, delete-orphan")
    user = relationship("M_User", back_populates="orders")
    paymentTransactions = relationship("M_PaymentTransaction", back_populates="order", cascade="all, delete-orphan")
    refundTickets = relationship("M_RefundTicket", back_populates="order")

    def updateStatus(self, newStatus: str, updatedBy: int) -> None:
        """Update order status with validation"""
        valid_statuses = ["pending", "paid", "shipped", "delivered", "cancelled"]
        if newStatus.lower() in valid_statuses:
            self.status = newStatus.lower()
            # Could log the update via logAudit with updatedBy

    def getItems(self):
        """Get all items in the order"""
        return self.items


class M_OrderItem(Base):
    __tablename__ = "order_items"

    # Map camelCase attributes to snake_case database columns
    orderItemId = Column("id", Integer, primary_key=True, index=True, autoincrement=True)
    orderId = Column("order_id", Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    laptopId = Column("product_id", Integer, ForeignKey("laptops.id", ondelete="RESTRICT"), nullable=False)
    quantity = Column("quantity", Integer, nullable=False)
    unitPrice = Column("price_at_purchase", DECIMAL(10, 2), nullable=False)
    subtotal = Column("subtotal", DECIMAL(10, 2), nullable=True)

    # Relationships
    order = relationship("M_Order", back_populates="items")
    laptop = relationship("M_Laptop", back_populates="orderItems")

    def computeSubtotal(self) -> float:
        """Compute the subtotal for this order item"""
        return float(self.quantity * self.unitPrice)
