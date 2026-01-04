from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    String,
    DateTime,
    Text,
    Enum,
    Index,
    CheckConstraint,
)
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from .base import Base


# Enum for Refund Status
class RefundStatus(enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class M_RefundTicket(Base):
    __tablename__ = "refund_tickets"

    # Map camelCase attributes to snake_case database columns
    ticketId = Column("id", Integer, primary_key=True, index=True)
    orderId = Column("order_id", Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    userId = Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    reason = Column("reason", String, nullable=False)
    status = Column("status", Enum(RefundStatus), nullable=False, default=RefundStatus.pending)
    adminComments = Column("admin_comments", Text, nullable=True)  # Admin comments when resolving refund ticket
    resolvedById = Column("resolved_by_id", Integer, ForeignKey("users.id"), nullable=True)  # Admin who resolved the ticket
    createdAt = Column("created_at", DateTime, default=datetime.utcnow)
    resolvedAt = Column("resolved_at", DateTime, nullable=True)

    # Additional contact fields
    email = Column("email", String, nullable=True)
    phoneNumber = Column("phone_number", String, nullable=True)

    # Relationships
    order = relationship("M_Order", back_populates="refundTickets")
    user = relationship("M_User", back_populates="refundTickets", foreign_keys=[userId])
    resolvedBy = relationship("M_User", foreign_keys=[resolvedById])  # Admin who resolved the ticket

    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'approved', 'rejected')",
            name="check_status_valid_values",
        ),
        Index("ix_refund_email_phone", "email", "phone_number", postgresql_using="btree"),
    )

    def approve(self, adminId: int, comments: str) -> None:
        """Approve the refund ticket"""
        self.status = RefundStatus.approved
        self.adminComments = comments
        self.resolvedById = adminId
        self.resolvedAt = datetime.utcnow()

    def reject(self, adminId: int, comments: str) -> None:
        """Reject the refund ticket"""
        self.status = RefundStatus.rejected
        self.adminComments = comments
        self.resolvedById = adminId
        self.resolvedAt = datetime.utcnow()
