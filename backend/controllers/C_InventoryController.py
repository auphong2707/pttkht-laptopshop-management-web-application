from .C_BaseController import C_BaseController
from sqlalchemy.orm import Session
from db.models import M_Laptop
from typing import List, Optional


class C_InventoryController(C_BaseController):
    """Controller for inventory management operations"""
    
    def __init__(self, db: Session):
        super().__init__()
        self.db = db
    
    def createNewLaptop(self, brand: str, modelName: str, specSummary: str, price: int, 
                       stockQty: int, **kwargs) -> int:
        """Create a new laptop in inventory"""
        new_laptop = M_Laptop(
            brand=brand,
            modelName=modelName,
            specSummary=specSummary,
            price=price,
            stockQty=stockQty,
            isActive=True,
            **kwargs  # Additional specifications
        )
        
        self.db.add(new_laptop)
        self.db.commit()
        self.db.refresh(new_laptop)
        
        self.logAudit("laptop_created", None, new_laptop.laptopId)
        
        return new_laptop.laptopId
    
    def modifyProduct(self, laptopId: int, **updates) -> M_Laptop:
        """Modify an existing laptop"""
        laptop = self.db.query(M_Laptop).filter(M_Laptop.laptopId == laptopId).first()
        if not laptop:
            raise ValueError("Laptop not found")
        
        # Update attributes
        for key, value in updates.items():
            if hasattr(laptop, key):
                setattr(laptop, key, value)
        
        self.db.commit()
        self.db.refresh(laptop)
        
        self.logAudit("laptop_modified", None, laptopId)
        
        return laptop
    
    def deleteLaptop(self, laptopId: int) -> None:
        """Delete (deactivate) a laptop from inventory"""
        laptop = self.db.query(M_Laptop).filter(M_Laptop.laptopId == laptopId).first()
        if not laptop:
            raise ValueError("Laptop not found")
        
        laptop.isActive = False
        self.db.commit()
        
        self.logAudit("laptop_deleted", None, laptopId)
    
    def listInventory(self, page: int, size: int) -> List[M_Laptop]:
        """List all laptops in inventory"""
        offset = (page - 1) * size
        laptops = self.db.query(M_Laptop).offset(offset).limit(size).all()
        return laptops
