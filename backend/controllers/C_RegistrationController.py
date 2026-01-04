from .C_BaseController import C_BaseController
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from db.models import M_User
from typing import Optional

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class C_RegistrationController(C_BaseController):
    """Controller for user registration"""
    
    def __init__(self, db: Session):
        super().__init__()
        self.db = db
    
    def validateForm(self, email: str, password: str, role: str) -> tuple[bool, Optional[str]]:
        """Validate registration form data"""
        if not self.validateEmail(email):
            return False, "Invalid email format"
        
        if not self.validatePassword(password):
            return False, "Password must be at least 8 characters with letters and numbers"
        
        if role not in ["customer", "admin"]:
            return False, "Invalid role"
        
        # Check if email already exists
        existing_user = self.db.query(M_User).filter(M_User.email == email).first()
        if existing_user:
            return False, "Email already registered"
        
        return True, None
    
    def register(self, email: str, password: str, role: str, firstName: str, 
                lastName: str, phoneNumber: str, shippingAddress: Optional[str] = None) -> int:
        """Register a new user and return userId"""
        # Validate first
        is_valid, error_message = self.validateForm(email, password, role)
        if not is_valid:
            raise ValueError(error_message)
        
        # Hash password
        hashed_password = pwd_context.hash(password)
        
        # Create new user
        new_user = M_User(
            email=email,
            role=role,
            firstName=firstName,
            lastName=lastName,
            phoneNumber=phoneNumber,
            shippingAddress=shippingAddress,
            isActive=True
        )
        new_user.setPasswordHash(hashed_password)
        
        self.db.add(new_user)
        self.db.commit()
        self.db.refresh(new_user)
        
        self.logAudit("user_registered", new_user.userId, new_user.userId)
        
        return new_user.userId
