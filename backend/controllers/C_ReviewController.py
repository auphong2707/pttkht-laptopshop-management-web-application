from .C_BaseController import C_BaseController
from sqlalchemy.orm import Session
from db.models import M_Review, M_Laptop
from datetime import datetime


class C_ReviewController(C_BaseController):
    """Controller for product review operations"""
    
    def __init__(self, db: Session):
        super().__init__()
        self.db = db
    
    def validateAndStoreReview(self, userId: int, laptopId: int, rating: int, comment: str) -> int:
        """Validate and store a product review"""
        # Validate rating
        if rating < 1 or rating > 5:
            raise ValueError("Rating must be between 1 and 5")
        
        # Check if laptop exists
        laptop = self.db.query(M_Laptop).filter(M_Laptop.laptopId == laptopId).first()
        if not laptop:
            raise ValueError("Laptop not found")
        
        # Create review
        review = M_Review(
            userId=userId,
            laptopId=laptopId,
            rating=rating,
            comment=comment,
            createdAt=datetime.utcnow().isoformat()
        )
        
        # Validate review
        if not review.validate():
            raise ValueError("Invalid review data")
        
        self.db.add(review)
        self.db.commit()
        self.db.refresh(review)
        
        # Update laptop rating
        self._updateLaptopRating(laptopId)
        
        self.logAudit("review_submitted", userId, review.reviewId)
        
        return review.reviewId
    
    def _updateLaptopRating(self, laptopId: int) -> None:
        """Recalculate and update laptop average rating"""
        laptop = self.db.query(M_Laptop).filter(M_Laptop.laptopId == laptopId).first()
        if not laptop:
            return
        
        # Get all reviews for this laptop
        reviews = laptop.reviews
        if reviews:
            avg_rating = sum(r.rating for r in reviews) / len(reviews)
            laptop.rate = round(avg_rating, 2)
            laptop.numRate = len(reviews)
            self.db.commit()
