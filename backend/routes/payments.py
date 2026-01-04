from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from db.session import get_db
from db.models import M_PaymentTransaction, M_Order
from controllers.C_PaymentController import C_PaymentController
from services.auth import get_current_user_id

payments_router = APIRouter(prefix="/payments", tags=["payments"])


# Request/Response Models
class PaymentCreateRequest(BaseModel):
    order_id: int
    payment_method: str  # 'e-banking' or 'delivery'


class PaymentTransactionResponse(BaseModel):
    id: int
    order_id: int
    amount: float
    method: str
    status: str
    gateway_ref: Optional[str]
    created_at: datetime
    paid_at: Optional[datetime]

    class Config:
        from_attributes = True


@payments_router.post("/create", response_model=PaymentTransactionResponse)
def create_payment_transaction(
    request: PaymentCreateRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Create a payment transaction for an order.
    - For COD (delivery): status is 'completed' immediately
    - For e-banking: status is 'pending' (QR code demo, no real gateway)
    """
    try:
        # Verify order belongs to user
        order = db.query(M_Order).filter(M_Order.orderId == request.order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        if order.userId != user_id:
            raise HTTPException(status_code=403, detail="Order does not belong to user")
        
        # Create payment transaction
        controller = C_PaymentController(db)
        transaction = controller.processPayment(request.order_id, request.payment_method)
        
        return PaymentTransactionResponse(
            id=transaction.transactionId,
            order_id=transaction.orderId,
            amount=float(transaction.amount),
            method=transaction.method,
            status=transaction.status,
            gateway_ref=transaction.gatewayRef,
            created_at=transaction.createdAt,
            paid_at=transaction.paidAt,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create payment transaction: {str(e)}")


@payments_router.get("/status/{transaction_id}", response_model=PaymentTransactionResponse)
def get_payment_status(
    transaction_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Get the status of a payment transaction.
    """
    transaction = db.query(M_PaymentTransaction).filter(
        M_PaymentTransaction.transactionId == transaction_id
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Verify transaction belongs to user's order
    order = transaction.order
    if order.userId != user_id:
        raise HTTPException(status_code=403, detail="Transaction does not belong to user")
    
    return PaymentTransactionResponse(
        id=transaction.transactionId,
        order_id=transaction.orderId,
        amount=float(transaction.amount),
        method=transaction.method,
        status=transaction.status,
        gateway_ref=transaction.gatewayRef,
        created_at=transaction.createdAt,
        paid_at=transaction.paidAt,
    )
