from .C_BaseController import C_BaseController
from sqlalchemy.orm import Session
from db.models import M_RefundTicket, M_Order, RefundStatus
from typing import List, Optional
from datetime import datetime


class C_RefundController(C_BaseController):
    """Controller for refund ticket operations"""
    
    def __init__(self, db: Session):
        super().__init__()
        self.db = db
    
    def submitRefundRequest(self, userId: int, orderId: int, reason: str,
                           email: str, phoneNumber: str) -> int:
        """Submit a new refund request"""
        # Verify order belongs to user
        order = self.db.query(M_Order).filter(
            M_Order.orderId == orderId,
            M_Order.userId == userId
        ).first()
        
        if not order:
            raise ValueError("Order not found")
        
        # Create refund ticket
        ticket = M_RefundTicket(
            orderId=orderId,
            userId=userId,
            reason=reason,
            email=email,
            phoneNumber=phoneNumber,
            status=RefundStatus.pending
        )
        
        self.db.add(ticket)
        self.db.commit()
        self.db.refresh(ticket)
        
        self.logAudit("refund_request_submitted", userId, ticket.ticketId)
        
        return ticket.ticketId
    
    def fetchPendingTickets(self, page: int, size: int) -> List[M_RefundTicket]:
        """Fetch pending refund tickets (for admin)"""
        offset = (page - 1) * size
        tickets = self.db.query(M_RefundTicket).filter(
            M_RefundTicket.status == RefundStatus.pending
        ).offset(offset).limit(size).all()
        return tickets
    
    def processTicket(self, ticketId: int, adminId: int, approve: bool, note: str) -> M_RefundTicket:
        """Process a refund ticket (approve or reject)"""
        ticket = self.db.query(M_RefundTicket).filter(
            M_RefundTicket.ticketId == ticketId
        ).first()
        
        if not ticket:
            raise ValueError("Ticket not found")
        
        if approve:
            ticket.approve(adminId, note)
        else:
            ticket.reject(adminId, note)
        
        self.db.commit()
        self.db.refresh(ticket)
        
        action = "approved" if approve else "rejected"
        self.logAudit(f"refund_{action}", adminId, ticketId)
        
        return ticket
    
    def solveTicket(self, adminId: int, ticketId: int, decision: str, comments: str) -> M_RefundTicket:
        """
        Design method: Solve refund ticket with admin decision and comments.
        Updates status to approved/rejected, saves admin comments and resolved_by_id.
        """
        ticket = self.db.query(M_RefundTicket).filter(
            M_RefundTicket.ticketId == ticketId
        ).first()
        
        if not ticket:
            raise ValueError("Ticket not found")
        
        # Validate decision
        if decision not in ["approved", "rejected"]:
            raise ValueError("Decision must be 'approved' or 'rejected'")
        
        # Update ticket
        ticket.status = RefundStatus.approved if decision == "approved" else RefundStatus.rejected
        ticket.adminComments = comments
        ticket.resolvedById = adminId
        ticket.resolvedAt = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(ticket)
        
        self.logAudit(f"refund_{decision}", adminId, ticketId)
        
        return ticket
    
    def getUserTickets(self, userId: int) -> List[M_RefundTicket]:
        """Get all refund tickets for a user"""
        tickets = self.db.query(M_RefundTicket).filter(
            M_RefundTicket.userId == userId
        ).order_by(M_RefundTicket.createdAt.desc()).all()
        return tickets
