"""
Local Authentication Service
Replaces Firebase authentication with JWT-based local authentication
"""
import os
import logging
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from db.session import get_db
from db.models import M_User

# Configure logging
logger = logging.getLogger(__name__)

# Security configurations
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Log SECRET_KEY for debugging (first 10 chars only)
logger.info(f"Using SECRET_KEY starting with: {SECRET_KEY[:10]}...")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Bearer token security
security = HTTPBearer()


# Pydantic models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    phone_number: str
    shipping_address: Optional[str] = None
    role: str = "customer"
    secret_key: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None
    role: Optional[str] = None


# Password utilities
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


# JWT token utilities
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> TokenData:
    """Decode and validate a JWT token"""
    try:
        logger.info(f"Decoding token with SECRET_KEY starting with: {SECRET_KEY[:10]}...")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        logger.info(f"Token payload: {payload}")
        
        user_id = payload.get("sub")
        email: str = payload.get("email")
        role: str = payload.get("role")
        
        if user_id is None:
            logger.error("Token payload missing 'sub' field")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user ID",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Convert to int if it's a string
        if isinstance(user_id, str):
            user_id = int(user_id)
        
        logger.info(f"Token decoded successfully for user_id: {user_id}, email: {email}, role: {role}")
        return TokenData(user_id=user_id, email=email, role=role)
    except JWTError as e:
        logger.error(f"JWT decode error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except ValueError as e:
        logger.error(f"Value error in token decode: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format",
            headers={"WWW-Authenticate": "Bearer"},
        )


# Authentication dependencies
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> M_User:
    """Get the current authenticated user from the token"""
    try:
        token = credentials.credentials
        logger.info(f"Received token (first 20 chars): {token[:20]}...")
        token_data = decode_token(token)
        logger.info(f"Token decoded successfully for user_id: {token_data.user_id}")
        
        user = db.query(M_User).filter(M_User.userId == token_data.user_id).first()
        if user is None:
            logger.error(f"User not found for user_id: {token_data.user_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        if not user.isActive:
            logger.warning(f"Inactive user attempted access: {user.email}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Inactive user"
            )
        
        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_current_user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> int:
    """Get the current user ID from the token (lightweight version)"""
    token = credentials.credentials
    token_data = decode_token(token)
    return token_data.user_id


def get_current_active_user(
    current_user: M_User = Depends(get_current_user)
) -> M_User:
    """Get current active user"""
    if not current_user.isActive:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def get_current_admin_user(
    current_user: M_User = Depends(get_current_user)
) -> M_User:
    """Get current user and verify they are an admin"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user


# User authentication functions
def authenticate_user(email: str, password: str, db: Session) -> Optional[M_User]:
    """Authenticate a user by email and password"""
    user = db.query(M_User).filter(M_User.email == email).first()
    if not user:
        return None
    if not user.verifyPassword(password):
        return None
    return user


def create_user(user_data: UserCreate, db: Session) -> M_User:
    """Create a new user"""
    # Validate role
    if user_data.role not in ["admin", "customer"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be 'admin' or 'customer'"
        )
    
    # If admin, require secret key
    if user_data.role == "admin":
        admin_secret = os.getenv("ADMIN_CREATION_SECRET")
        if not admin_secret or user_data.secret_key != admin_secret:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorized to create admin account"
            )
    
    # Check if email already exists
    if db.query(M_User).filter(M_User.email == user_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if phone number already exists
    if db.query(M_User).filter(M_User.phoneNumber == user_data.phone_number).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = M_User(
        email=user_data.email,
        firstName=user_data.first_name,
        lastName=user_data.last_name,
        phoneNumber=user_data.phone_number,
        shippingAddress=user_data.shipping_address,
        role=user_data.role
    )
    db_user.setPasswordHash(hashed_password)
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user
