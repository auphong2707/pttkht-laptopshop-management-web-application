from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    String,
    DateTime,
)
from sqlalchemy.orm import relationship
from .base import Base


class M_Review(Base):
    __tablename__ = "reviews"

    # Map camelCase attributes to snake_case database columns
    reviewId = Column("id", Integer, primary_key=True, autoincrement=True)
    rating = Column("rating", Integer, nullable=False)
    comment = Column("review_text", String, nullable=True)
    userId = Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    laptopId = Column("laptop_id", Integer, ForeignKey("laptops.id", ondelete="CASCADE"), nullable=False)
    createdAt = Column("created_at", DateTime, nullable=False)

    # Relationships
    user = relationship("M_User", back_populates="reviews")
    laptop = relationship("M_Laptop", back_populates="reviews")

    def validate(self) -> bool:
        """Validate review data"""
        if self.rating < 1 or self.rating > 5:
            return False
        if self.comment and len(self.comment) < 1:
            return False
        return True
