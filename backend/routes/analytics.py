from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from db.session import get_db
from controllers.C_AnalyticsController import C_AnalyticsController
from services.auth import get_current_admin_user
from db.models import M_User
from datetime import datetime

analytics_router = APIRouter(prefix="/analytics", tags=["analytics"])


@analytics_router.get("/metrics")
def get_metrics(
    period_start: datetime = Query(..., description="Start of period"),
    period_end: datetime = Query(..., description="End of period"),
    current_user: M_User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get analytics metrics for a specific time period (admin only)"""
    try:
        controller = C_AnalyticsController(db)
        metrics = controller.getMetrics(period_start, period_end)
        
        return {
            "total_orders": metrics.totalOrders,
            "total_revenue": metrics.totalRevenue,
            "average_order_value": metrics.averageOrderValue(),
            "period_start": metrics.periodStart.isoformat(),
            "period_end": metrics.periodEnd.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
