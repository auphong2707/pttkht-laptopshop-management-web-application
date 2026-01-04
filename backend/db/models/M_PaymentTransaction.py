from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    String,
    DECIMAL,
    TIMESTAMP,
    func,
)
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base


class M_PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    # Map camelCase attributes to snake_case database columns
    transactionId = Column("id", Integer, primary_key=True, index=True, autoincrement=True)
    orderId = Column("order_id", Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column("amount", DECIMAL(10, 2), nullable=False)
    method = Column("method", String(50), nullable=False)
    status = Column("status", String(50), nullable=False, default="Pending")
    gatewayRef = Column("gateway_ref", String(255), nullable=True)
    createdAt = Column("created_at", TIMESTAMP, server_default=func.now())
    paidAt = Column("paid_at", TIMESTAMP, nullable=True)

    # Relationships
    order = relationship("M_Order", back_populates="paymentTransactions")

    def markSuccess(self, gatewayRef: str, paidAt: datetime) -> None:
        """Mark transaction as successful"""
        self.status = "Success"
        self.gatewayRef = gatewayRef
        self.paidAt = paidAt

    def markFailed(self, reason: str) -> None:
        """Mark transaction as failed"""
        self.status = "Failed"
        # Could store reason in a notes field if added
