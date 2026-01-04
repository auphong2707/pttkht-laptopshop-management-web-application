from pydantic import BaseModel
from datetime import datetime


class Metrics(BaseModel):
    """Metrics DTO for analytics"""
    
    totalOrders: int
    totalRevenue: float
    periodStart: datetime
    periodEnd: datetime
    
    def averageOrderValue(self) -> float:
        """Calculate average order value"""
        if self.totalOrders == 0:
            return 0.0
        return self.totalRevenue / self.totalOrders
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
