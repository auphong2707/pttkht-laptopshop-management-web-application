# routes/reviews.py

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime

from db.models import M_Review, M_Laptop
from schemas.reviews import ReviewCreate, ReviewResponse
from services.auth import get_current_user_id
from db.session import get_db

reviews_router = APIRouter(prefix="/reviews", tags=["reviews"])


@reviews_router.post("/", response_model=ReviewResponse)
async def create_review(review: ReviewCreate, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    # Check if the laptop with the provided laptop_id exists
    laptop = db.query(M_Laptop).filter(M_Laptop.laptopId == review.laptop_id).first()

    if not laptop:
        raise HTTPException(status_code=404, detail="Laptop not found")

    new_review = M_Review(
        userId=user_id,
        laptopId=review.laptop_id,
        rating=review.rating,
        comment=review.review_text,
        createdAt=datetime.utcnow(),
    )

    db.add(new_review)
    db.commit()
    db.refresh(new_review)

    return new_review

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
    # Check if the laptop exists
    laptop = db.query(M_Laptop).filter(M_Laptop.laptopId == laptop_id).first()
    if not laptop:
        raise HTTPException(status_code=404, detail="Laptop not found")
    
    # Get reviews for this laptop
    reviews = db.query(M_Review).filter(M_Review.laptopId == laptop_id).offset(skip).all()
    
    if not reviews:
        return []
    
    return reviews
