from .C_BaseController import C_BaseController
from sqlalchemy.orm import Session
from db.models import M_User
from datetime import datetime, timedelta
from typing import Optional
import jwt
import os

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days (matches auth.py)


class C_LoginController(C_BaseController):
    """Controller for user login and authentication"""
    
    def __init__(self, db: Session):
        super().__init__()
        self.db = db
        self.currentSessionToken: Optional[str] = None
        self.currentUserId: Optional[int] = None
    
    def submitCredentials(self, email: str, password: str) -> dict:
        """Submit and verify user credentials"""
        # Validate format
        if not self.validateEmail(email):
            return self.handleError("INVALID_EMAIL", "Invalid email format")
        
        # Find user
        user = self.db.query(M_User).filter(M_User.email == email).first()
        if not user:
            return self.handleError("USER_NOT_FOUND", "Invalid credentials")
        
        # Verify password
        if not user.verifyPassword(password):
            return self.handleError("INVALID_PASSWORD", "Invalid credentials")
        
        # Check if user is active
        if not user.isActive:
            return self.handleError("USER_INACTIVE", "User account is deactivated")
        
        # Update last login time
        user.setLastLogin(datetime.utcnow())
        self.db.commit()
        
        # Generate token
        token = self._createAccessToken(user)
        self.currentSessionToken = token
        self.currentUserId = user.userId
        
        self.logAudit("user_login", user.userId, user.userId)
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "user_id": user.userId,
            "role": user.role,
            "email": user.email
        }
    
    def verifyCredentials(self) -> bool:
        """Verify current session credentials"""
        return self.currentSessionToken is not None and self.currentUserId is not None
    
    def logout(self) -> None:
        """Logout current user"""
        if self.currentUserId:
            self.logAudit("user_logout", self.currentUserId, self.currentUserId)
        
        self.currentSessionToken = None
        self.currentUserId = None
    
    def _createAccessToken(self, user: M_User) -> str:
        """Create JWT access token"""
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode = {
            "sub": str(user.userId),
            "email": user.email,
            "role": user.role,
            "exp": expire
        }
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
