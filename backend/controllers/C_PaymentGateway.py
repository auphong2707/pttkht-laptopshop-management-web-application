from .C_BaseController import C_BaseController
from abc import ABC, abstractmethod
from datetime import datetime


class C_PaymentGateway(C_BaseController, ABC):
    """Abstract payment gateway for external payment providers"""
    
    def __init__(self):
        super().__init__()
    
    @abstractmethod
    def createTransaction(self, orderId: int, amount: float, method: str) -> dict:
        """Create a new payment transaction with the gateway"""
        pass
    
    @abstractmethod
    def transactionSuccess(self, transactionId: int, gatewayRef: str) -> None:
        """Handle successful transaction callback"""
        pass
    
    @abstractmethod
    def transactionFail(self, transactionId: int, reason: str) -> None:
        """Handle failed transaction callback"""
        pass
