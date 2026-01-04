from .C_BaseController import C_BaseController
from .C_PaymentGateway import C_PaymentGateway
from sqlalchemy.orm import Session
from db.models import M_PaymentTransaction, M_Order
from datetime import datetime
from typing import Optional


class C_PaymentController(C_BaseController):
    """Controller for payment processing"""
    
    def __init__(self, db: Session, gateway: Optional[C_PaymentGateway] = None):
        super().__init__()
        self.db = db
        self.gateway = gateway
    
    def processPayment(self, orderId: int, paymentMethod: str) -> M_PaymentTransaction:
        """
        Design method: Process payment and create payment transaction record.
        For COD: mark as completed immediately
        For e-banking: mark as pending (demo QR code, no real gateway)
        """
        # Get order
        order = self.db.query(M_Order).filter(M_Order.orderId == orderId).first()
        if not order:
            raise ValueError("Order not found")
        
        # Determine status based on payment method
        if paymentMethod == "delivery":
            # Cash on delivery - mark as completed
            status = "completed"
            paidAt = datetime.utcnow()
        else:
            # e-banking - mark as pending (QR demo)
            status = "pending"
            paidAt = None
        
        # Create payment transaction
        transaction = M_PaymentTransaction(
            orderId=orderId,
            amount=order.totalAmount,
            method=paymentMethod,
            status=status,
            paidAt=paidAt
        )
        
        self.db.add(transaction)
        self.db.commit()
        self.db.refresh(transaction)
        
        self.logAudit("payment_transaction_created", order.userId, transaction.transactionId)
        
        return transaction
    
    def makePayment(self, orderId: int, method: str) -> M_PaymentTransaction:
        """Initiate a payment for an order (legacy method)"""
        return self.processPayment(orderId, method)
    
    def confirmPayment(self, transactionId: int, gatewayRef: str) -> M_PaymentTransaction:
        """Confirm a payment transaction"""
        transaction = self.db.query(M_PaymentTransaction).filter(
            M_PaymentTransaction.transactionId == transactionId
        ).first()
        
        if not transaction:
            raise ValueError("Transaction not found")
        
        # Mark transaction as successful
        transaction.markSuccess(gatewayRef, datetime.utcnow())
        
        # Update order status to paid
        order = transaction.order
        order.updateStatus("paid", 0)  # System update
        
        self.db.commit()
        self.db.refresh(transaction)
        
        # Notify gateway if configured
        if self.gateway:
            self.gateway.transactionSuccess(transactionId, gatewayRef)
        
        self.logAudit("payment_confirmed", order.userId, transactionId)
        
        return transaction
    
    def recordTransaction(self, orderId: int, amount: float, method: str, status: str) -> M_PaymentTransaction:
        """
        Design method: Record a payment transaction
        """
        transaction = M_PaymentTransaction(
            orderId=orderId,
            amount=amount,
            method=method,
            status=status,
            paidAt=datetime.utcnow() if status == "completed" else None
        )
        
        self.db.add(transaction)
        self.db.commit()
        self.db.refresh(transaction)
        
        return transaction
    
    def updateOrderStatus(self, orderId: int, status: str) -> None:
        """Update order status after payment"""
        order = self.db.query(M_Order).filter(M_Order.orderId == orderId).first()
        if order:
            order.updateStatus(status, 0)  # System update
            self.db.commit()
            self.logAudit("order_status_updated_by_payment", 0, orderId)
