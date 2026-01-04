from pydantic import BaseModel, Field
from typing import Optional, ForwardRef
from datetime import datetime
from sqlalchemy.orm import relationship

# Import the OrderResponse or use a forward reference
from schemas.orders import OrderResponse


class RefundTicketCreate(BaseModel):
    email: str
    phone_number: str = Field(validation_alias="phoneNumber", serialization_alias="phone_number")
    order_id: int = Field(validation_alias="orderId", serialization_alias="order_id")
    reason: str
    status: str = "pending"  # Default to pending
    created_at: datetime = Field(
        default_factory=datetime.utcnow, validation_alias="createdAt", serialization_alias="created_at"
    )  # Auto-set current timestamp
    resolved_at: Optional[datetime] = Field(
        None, validation_alias="resolvedAt", serialization_alias="resolved_at"
    )  # This can be set later when the refund is resolved

    class Config:
        orm_mode = True  # Tell Pydantic to treat the model as a dict
        populate_by_name = True


class RefundTicketUpdate(BaseModel):
    email: Optional[str] = None
    phone_number: Optional[str] = Field(None, validation_alias="phoneNumber", serialization_alias="phone_number")
    order_id: Optional[int] = Field(None, validation_alias="orderId", serialization_alias="order_id")
    reason: Optional[str] = None
    status: Optional[str] = (
        None  # You can update the status (pending, resolved)
    )
    resolved_at: Optional[datetime] = Field(None, validation_alias="resolvedAt", serialization_alias="resolved_at")

    class Config:
        orm_mode = True  # Tell Pydantic to treat the model as a dict
        populate_by_name = True

class RefundTicketResponse(RefundTicketCreate):
    id: int = Field(validation_alias="ticketId", serialization_alias="id")
    order: Optional[OrderResponse] = None  # Relationship to the Order
    admin_comments: Optional[str] = Field(None, validation_alias="adminComments", serialization_alias="admin_comments")

    class Config:
        orm_mode = True  # Tell Pydantic to treat the model as a dict
        from_attributes = True  # New in Pydantic v2, equivalent to orm_mode
        arbitrary_types_allowed = True  # Allow arbitrary SQLAlchemy relationship types
        populate_by_name = True
