# routes/reviews.py

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime

from db.models import M_Review, M_Laptop
from schemas.reviews import ReviewCreate, ReviewResponse
from services.auth import get_current_user_id
from db.session import get_db
from controllers.C_ReviewController import C_ReviewController
from controllers.C_ProductController import C_ProductController

reviews_router = APIRouter(prefix="/reviews", tags=["reviews"])


@reviews_router.post("/", response_model=ReviewResponse)
async def create_review(review: ReviewCreate, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    controller = C_ReviewController(db)
    
    try:
        # Use controller to validate and store review
        review_id = controller.validateAndStoreReview(
            userId=user_id,
            laptopId=review.laptop_id,
            rating=review.rating,
            comment=review.review_text
        )
        
        # Fetch and return the created review
        new_review = db.query(M_Review).filter(M_Review.reviewId == review_id).first()
        return new_review
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@reviews_router.get("/user", response_model=list[ReviewResponse])
async def get_reviews_by_user(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    reviews = db.query(M_Review).filter(M_Review.userId == user_id).offset(skip).limit(limit).all()
    
    if not reviews:
        return []
    
    return reviews

@reviews_router.get("/laptop/{laptop_id}", response_model=list[ReviewResponse])
async def get_reviews_by_laptop(
    laptop_id: int,
    skip: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    product_controller = C_ProductController(db)
    
    # Check if the laptop exists using controller
    laptop = product_controller.getLaptopDetails(laptop_id)
    if not laptop:
        raise HTTPException(status_code=404, detail="Laptop not found")
    
    # Get reviews for this laptop using controller
    reviews = product_controller.getLaptopReviews(laptop_id)
    
    # Apply pagination manually
    if skip > 0:
        reviews = reviews[skip:]
    
    if not reviews:
        return []
    
    return reviews
