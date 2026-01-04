from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from decimal import Decimal


class OrderItemBase(BaseModel):
    product_id: int = Field(validation_alias="laptopId", serialization_alias="product_id")
    quantity: int
    price_at_purchase: int = Field(validation_alias="unitPrice", serialization_alias="price_at_purchase")

    class Config:
        from_attributes = True
        populate_by_name = True


class OrderBase(BaseModel):
    user_id: Optional[int] = Field(None, validation_alias="userId", serialization_alias="user_id")
    total_price: int = Field(validation_alias="totalAmount", serialization_alias="total_price")
    status: str
    created_at: datetime = Field(validation_alias="createdAt", serialization_alias="created_at")
    updated_at: datetime = Field(validation_alias="updatedAt", serialization_alias="updated_at")

    first_name: Optional[str] = Field(None, validation_alias="firstName", serialization_alias="first_name")
    last_name: Optional[str] = Field(None, validation_alias="lastName", serialization_alias="last_name")
    user_email: Optional[str] = Field(None, validation_alias="userEmail", serialization_alias="user_email")
    shipping_address: Optional[str] = Field(None, validation_alias="shippingAddress", serialization_alias="shipping_address")
    phone_number: Optional[str] = Field(None, validation_alias="phoneNumber", serialization_alias="phone_number")
    payment_method: Optional[str] = Field(None, validation_alias="paymentMethod", serialization_alias="payment_method")

    class Config:
        from_attributes = True
        populate_by_name = True


class OrderResponse(OrderBase):
    id: int = Field(validation_alias="orderId", serialization_alias="id")
    items: List[OrderItemBase]
    refund_ticket: Optional[dict] = None  # Contains refund ticket info if exists

    class Config:
        from_attributes = True
        populate_by_name = True


class UpdateStatus(BaseModel):
    status: str
