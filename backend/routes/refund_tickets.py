from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from pydantic import BaseModel

from db.models import M_RefundTicket, M_Order, M_User, RefundStatus
from schemas.refund_tickets import (
    RefundTicketCreate,
    RefundTicketUpdate,
    RefundTicketResponse,
)
from db.session import get_db
from controllers.C_RefundController import C_RefundController
from services.auth import get_current_admin_user, get_current_user_id

refund_tickets_router = APIRouter(prefix="/refund-tickets", tags=["refund-tickets"])


async def require_admin_role(user: M_User = Depends(get_current_admin_user)):
    """Dependency to ensure the current user has admin role."""
    return user


@refund_tickets_router.post("/", response_model=RefundTicketResponse)
async def create_refund_ticket(
    refund_ticket: RefundTicketCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    print(f"Creating refund ticket: {refund_ticket}")
    existing_ticket = (
        db.query(M_RefundTicket)
        .filter(
            M_RefundTicket.email == refund_ticket.email,
            M_RefundTicket.phoneNumber == refund_ticket.phone_number,
            M_RefundTicket.orderId == refund_ticket.order_id
        )
        .first()
    )

    if existing_ticket:
        raise HTTPException(
            status_code=400,
            detail="Refund ticket already exists for this email and phone number combination.",
        )


    # Check if the order exists and is delivered
    order = db.query(M_Order).filter(M_Order.orderId == refund_ticket.order_id).first()

    print(f"Order found: {order.status if order else 'None'}")
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status != "delivered":
        raise HTTPException(status_code=400, detail="Refund can only be requested for delivered orders")

    new_refund_ticket = M_RefundTicket(
        email=refund_ticket.email,
        phoneNumber=refund_ticket.phone_number,
        orderId=refund_ticket.order_id,
        userId=user_id,
        reason=refund_ticket.reason,
        status=RefundStatus[refund_ticket.status] if refund_ticket.status else RefundStatus.pending,
    )

    try:
        db.add(new_refund_ticket)
        db.commit()
        db.refresh(new_refund_ticket)

        return RefundTicketResponse(
            id=new_refund_ticket.ticketId,
            email=new_refund_ticket.email,
            phone_number=new_refund_ticket.phoneNumber,
            order_id=new_refund_ticket.orderId,
            reason=new_refund_ticket.reason,
            status=new_refund_ticket.status.value,
            created_at=new_refund_ticket.createdAt,
            resolved_at=new_refund_ticket.resolvedAt,
        )

    except IntegrityError as e:
        db.rollback()
        print(f"IntegrityError: {e}")
        raise HTTPException(status_code=500, detail="Error creating the refund ticket.")
    except Exception as e:
        db.rollback()
        print(f"Exception: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Error creating the refund ticket.")


@refund_tickets_router.get("/", response_model=List[RefundTicketResponse], dependencies=[Depends(require_admin_role)])
async def get_refund_tickets(
    email: Optional[str] = None,
    phone_number: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    # Use options(joinedload) to eager load the Order relationship and its items
    query = db.query(M_RefundTicket).options(
        joinedload(M_RefundTicket.order).joinedload(M_Order.items)
    ).join(M_Order, M_RefundTicket.orderId == M_Order.orderId)

    if email:
        query = query.filter(M_RefundTicket.email == email)
    if phone_number:
        query = query.filter(M_RefundTicket.phoneNumber == phone_number)
    if status:
        query = query.filter(M_RefundTicket.status == status)

    return query.all()


@refund_tickets_router.put("/{refund_ticket_id}", response_model=RefundTicketResponse)
async def update_refund_ticket(
    refund_ticket_id: int,
    refund_ticket_update: RefundTicketUpdate,
    db: Session = Depends(get_db),
):
    refund_ticket = (
        db.query(M_RefundTicket).filter(M_RefundTicket.ticketId == refund_ticket_id).first()
    )

    if not refund_ticket:
        raise HTTPException(status_code=404, detail="Refund ticket not found")

    if refund_ticket_update.status:
        refund_ticket.status = refund_ticket_update.status
    if refund_ticket_update.resolved_at:
        refund_ticket.resolved_at = refund_ticket_update.resolved_at

    db.commit()
    db.refresh(refund_ticket)

    return refund_ticket


# New resolve endpoint per design specification
class RefundResolveRequest(BaseModel):
    decision: str  # 'approved' or 'rejected'
    admin_comments: str


@refund_tickets_router.patch("/{refund_ticket_id}/resolve", response_model=RefundTicketResponse)
async def resolve_refund_ticket(
    refund_ticket_id: int,
    request: RefundResolveRequest,
    admin_user: M_User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """
    Resolve a refund ticket with admin decision and comments.
    Design method: solveTicket(adminId, ticketId, decision, comments)
    """
    try:
        controller = C_RefundController(db)
        ticket = controller.solveTicket(
            adminId=admin_user.userId,
            ticketId=refund_ticket_id,
            decision=request.decision,
            comments=request.admin_comments
        )
        
        return RefundTicketResponse(
            id=ticket.ticketId,
            email=ticket.email,
            phone_number=ticket.phoneNumber,
            order_id=ticket.orderId,
            reason=ticket.reason,
            status=ticket.status.value,
            created_at=ticket.createdAt,
            resolved_at=ticket.resolvedAt,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to resolve refund ticket: {str(e)}")

