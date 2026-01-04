from sqlalchemy import (
    Column,
    Integer,
    String,
    TIMESTAMP,
    func,
    Text,
    Boolean,
    CheckConstraint,
)
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base, pwd_context


class M_User(Base):
    __tablename__ = "users"

    # Map camelCase attributes to snake_case database columns
    userId = Column("id", Integer, primary_key=True, index=True, autoincrement=True)
    email = Column("email", String(255), unique=True, nullable=False, index=True)
    role = Column("role", String(20), nullable=False, default="customer")
    __passwordHash = Column("hashed_password", String(255), nullable=False)
    isActive = Column("is_active", Boolean, default=True, nullable=False)
    createdAt = Column("created_at", TIMESTAMP, server_default=func.now())
    lastLoginAt = Column("last_login_at", TIMESTAMP, nullable=True)

    # Additional fields for user profile
    firstName = Column("first_name", String(100), nullable=False)
    lastName = Column("last_name", String(100), nullable=False)
    phoneNumber = Column("phone_number", String(20), unique=True, nullable=False, index=True)
    shippingAddress = Column("shipping_address", Text, nullable=True)
    updatedAt = Column("updated_at", TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relationships
    reviews = relationship("M_Review", back_populates="user", cascade="all, delete-orphan")
    orders = relationship("M_Order", back_populates="user", cascade="all, delete-orphan")
    carts = relationship("M_Cart", back_populates="user", cascade="all, delete-orphan")
    refundTickets = relationship("M_RefundTicket", back_populates="user", cascade="all, delete-orphan", foreign_keys="M_RefundTicket.userId")

    __table_args__ = (
        CheckConstraint("role IN ('customer', 'admin')", name="check_valid_role"),
    )

    def verifyPassword(self, plainPassword: str) -> bool:
        """Verify if the provided password matches the stored hash"""
        return pwd_context.verify(plainPassword, self.__passwordHash)

    def setPasswordHash(self, hashedPassword: str) -> None:
        """Set the password hash (expects already hashed password)"""
        self.__passwordHash = hashedPassword

    def deactivate(self, reason: str) -> None:
        """Deactivate the user account"""
        self.isActive = False
        # Could log the reason to audit table via logAudit

    def setLastLogin(self, time: datetime) -> None:
        """Update the last login timestamp"""
        self.lastLoginAt = time
