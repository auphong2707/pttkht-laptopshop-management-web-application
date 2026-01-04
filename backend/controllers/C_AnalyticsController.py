from .C_BaseController import C_BaseController
from sqlalchemy.orm import Session
from sqlalchemy import func
from db.models import M_Order
from datetime import datetime
from typing import Optional


class C_AnalyticsController(C_BaseController):
    """Controller for analytics and metrics"""
    
    def __init__(self, db: Session):
        super().__init__()
        self.db = db
    
    def getMetrics(self, periodStart: datetime, periodEnd: datetime):
        """Get metrics for a specific time period"""
        # Query orders within the period
        orders = self.db.query(M_Order).filter(
            M_Order.createdAt >= periodStart,
            M_Order.createdAt <= periodEnd
        ).all()
        
        # Calculate metrics
        totalOrders = len(orders)
        totalRevenue = sum(float(order.totalAmount) for order in orders)
        
        # Create metrics object
        from schemas.metrics import Metrics
        metrics = Metrics(
            totalOrders=totalOrders,
            totalRevenue=totalRevenue,
            periodStart=periodStart,
            periodEnd=periodEnd
        )
        
        self.logAudit("metrics_retrieved", None, None)
        
        return metrics
