from pydantic import BaseModel, Field, ConfigDict, field_serializer
from typing import Optional, Union
from datetime import datetime


class ReviewCreate(BaseModel):
    laptop_id: int
    rating: int  # Rating should be between 1 and 5
    review_text: Optional[str] = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class ReviewResponse(BaseModel):
    reviewId: int = Field(validation_alias="reviewId", serialization_alias="reviewId")
    laptopId: int = Field(validation_alias="laptopId", serialization_alias="laptopId")
    rating: int
    comment: Optional[str] = Field(default=None, validation_alias="comment", serialization_alias="comment")
    userId: Optional[int] = Field(default=None, validation_alias="userId", serialization_alias="userId")
    createdAt: Union[str, datetime] = Field(validation_alias="createdAt", serialization_alias="createdAt")

    @field_serializer('createdAt')
    def serialize_created_at(self, value: Union[str, datetime]) -> str:
        if isinstance(value, datetime):
            return value.isoformat()
        return value

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
