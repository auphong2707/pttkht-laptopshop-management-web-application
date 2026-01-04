from .C_BaseController import C_BaseController
from sqlalchemy.orm import Session
from db.models import M_Laptop, M_Review
from typing import List, Optional


class C_ProductController(C_BaseController):
    """Controller for product/laptop operations"""
    
    def __init__(self, db: Session):
        super().__init__()
        self.db = db
    
    def fetchPaginatedProducts(self, page: int, size: int) -> List[M_Laptop]:
        """Fetch paginated list of products"""
        offset = (page - 1) * size
        products = self.db.query(M_Laptop).filter(
            M_Laptop.isActive == True
        ).offset(offset).limit(size).all()
        return products
    
    def fetchNextPage(self, cursor: int, size: int) -> List[M_Laptop]:
        """Fetch next page of products using cursor-based pagination"""
        products = self.db.query(M_Laptop).filter(
            M_Laptop.laptopId > cursor,
            M_Laptop.isActive == True
        ).limit(size).all()
        return products
    
    def queryProducts(self, keywords: str, page: int, size: int) -> List[M_Laptop]:
        """Search products by keywords"""
        offset = (page - 1) * size
        search_pattern = f"%{keywords}%"
        products = self.db.query(M_Laptop).filter(
            M_Laptop.isActive == True,
            (M_Laptop.modelName.ilike(search_pattern) | 
             M_Laptop.brand.ilike(search_pattern) |
             M_Laptop.specSummary.ilike(search_pattern))
        ).offset(offset).limit(size).all()
        return products
    
    def queryFilteredProducts(self, criteria) -> List[M_Laptop]:
        """Query products with filter criteria"""
        query = self.db.query(M_Laptop).filter(M_Laptop.isActive == True)
        
        if criteria.brand:
            query = query.filter(M_Laptop.brand == criteria.brand)
        
        if criteria.minPrice is not None:
            query = query.filter(M_Laptop.price >= criteria.minPrice)
        
        if criteria.maxPrice is not None:
            query = query.filter(M_Laptop.price <= criteria.maxPrice)
        
        if criteria.keywords:
            search_pattern = f"%{criteria.keywords}%"
            query = query.filter(
                (M_Laptop.modelName.ilike(search_pattern) | 
                 M_Laptop.brand.ilike(search_pattern) |
                 M_Laptop.specSummary.ilike(search_pattern))
            )
        
        # Pagination
        offset = (criteria.page - 1) * criteria.pageSize
        products = query.offset(offset).limit(criteria.pageSize).all()
        
        return products
    
    def getLaptopDetails(self, laptopId: int) -> Optional[M_Laptop]:
        """Get detailed information about a specific laptop"""
        laptop = self.db.query(M_Laptop).filter(
            M_Laptop.laptopId == laptopId
        ).first()
        return laptop
    
    def getLaptopReviews(self, laptopId: int) -> List[M_Review]:
        """Get all reviews for a specific laptop"""
        reviews = self.db.query(M_Review).filter(
            M_Review.laptopId == laptopId
        ).all()
        return reviews
