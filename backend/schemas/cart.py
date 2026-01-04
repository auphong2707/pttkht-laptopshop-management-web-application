from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class CartItemAdd(BaseModel):
    laptop_id: int = Field(..., description="ID of the laptop to add to the cart")
    quantity: int = Field(
        ..., gt=0, description="Quantity of the laptop to add to the cart"
    )


class CartItemUpdate(BaseModel):
    laptop_id: int = Field(..., description="ID of the laptop to update in the cart")
    new_quantity: int = Field(
        ..., ge=0, description="New quantity of the laptop in the cart"
    )


class CartItemResponse(BaseModel):
    id: int
    laptop_id: int
    laptop_name: str
    laptop_image: Optional[str]
    quantity: int
    unit_price: float
    subtotal: float

    class Config:
        from_attributes = True


class CartResponse(BaseModel):
    cart_id: int
    total_amount: float
    updated_at: datetime
    items: List[CartItemResponse]

    class Config:
        from_attributes = True
