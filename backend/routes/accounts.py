import os
from fastapi import APIRouter, Body, HTTPException, Depends
from sqlalchemy.orm import Session
from services.auth import (
    UserCreate,
    UserLogin,
    Token,
    get_current_user,
    get_current_admin_user,
)
from db.session import get_db
from db.models import M_User
from controllers.C_RegistrationController import C_RegistrationController
from controllers.C_LoginController import C_LoginController

accounts_router = APIRouter(prefix="/accounts", tags=["accounts"])


@accounts_router.post("/check")
def check_email_and_phone(data: dict = Body(...), db: Session = Depends(get_db)):
    """Check if email or phone number already exists"""
    email = data.get("email")
    phone = data.get("phone_number")

    email_exists = False
    phone_exists = False

    if email:
        email_exists = db.query(M_User).filter(M_User.email == email).first() is not None

    if phone:
        phone_exists = db.query(M_User).filter(M_User.phoneNumber == phone).first() is not None

    return {"email_exists": email_exists, "phone_exists": phone_exists}


@accounts_router.post("", status_code=201)
def create_account(user_data: UserCreate, db: Session = Depends(get_db)):
    """Create a new user account"""
    try:
        controller = C_RegistrationController(db)
        user_id = controller.register(
            email=user_data.email,
            password=user_data.password,
            role=user_data.role,
            firstName=user_data.first_name,
            lastName=user_data.last_name,
            phoneNumber=user_data.phone_number,
            shippingAddress=user_data.shipping_address
        )
        
        return {
            "message": f"{user_data.role.capitalize()} account created successfully",
            "user_id": user_id,
            "email": user_data.email,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@accounts_router.delete("/{user_id}")
def delete_account(
    user_id: int,
    current_user: M_User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Delete a user account (admin only)"""
    try:
        user = db.query(M_User).filter(M_User.userId == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        db.delete(user)
        db.commit()
        
        return {"message": f"Account with ID {user_id} deleted successfully."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@accounts_router.post("/login", response_model=Token)
def login_user(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """Login and receive access token"""
    try:
        controller = C_LoginController(db)
        result = controller.submitCredentials(user_credentials.email, user_credentials.password)
        
        # Check if result contains error
        if "error" in result:
            raise HTTPException(
                status_code=401,
                detail=result["message"],
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@accounts_router.get("/profile")
def get_account_profile(current_user: M_User = Depends(get_current_user)):
    """Get the complete profile information for the authenticated user"""
    return {
        "id": current_user.userId,
        "email": current_user.email,
        "first_name": current_user.firstName,
        "last_name": current_user.lastName,
        "phone_number": current_user.phoneNumber,
        "shipping_address": current_user.shippingAddress,
        "role": current_user.role,
        "is_active": current_user.isActive,
        "created_at": current_user.createdAt,
    }


@accounts_router.put("/profile")
def update_account_profile(
    data: dict = Body(...),
    current_user: M_User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update the authenticated user's profile"""
    try:
        # Fields that can be updated (camelCase to attribute mapping)
        field_mapping = {
            "first_name": "firstName",
            "last_name": "lastName",
            "phone_number": "phoneNumber",
            "shipping_address": "shippingAddress"
        }
        
        for api_field, attr_name in field_mapping.items():
            if api_field in data:
                setattr(current_user, attr_name, data[api_field])
        
        db.commit()
        db.refresh(current_user)
        
        return {
            "message": "Profile updated successfully",
            "user": {
                "id": current_user.userId,
                "email": current_user.email,
                "first_name": current_user.firstName,
                "last_name": current_user.lastName,
                "phone_number": current_user.phoneNumber,
                "shipping_address": current_user.shippingAddress,
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))