import re
from typing import Optional
import logging
from datetime import datetime

# Setup logging
logger = logging.getLogger(__name__)


class C_BaseController:
    """Base controller with common validation and utility methods"""
    
    def __init__(self):
        pass
    
    def validateEmail(self, email: str) -> bool:
        """Validate email format"""
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(email_pattern, email))
    
    def validatePassword(self, password: str) -> bool:
        """Validate password strength (min 8 chars, at least one letter and one number)"""
        if len(password) < 8:
            return False
        has_letter = any(c.isalpha() for c in password)
        has_digit = any(c.isdigit() for c in password)
        return has_letter and has_digit
    
    def handleError(self, errorCode: str, message: str) -> dict:
        """Standardized error handling"""
        logger.error(f"Error [{errorCode}]: {message}")
        return {
            "error": errorCode,
            "message": message,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def logAudit(self, eventName: str, actorId: Optional[int], entityId: Optional[int]) -> None:
        """Log audit events for tracking user actions"""
        audit_entry = {
            "event": eventName,
            "actor_id": actorId,
            "entity_id": entityId,
            "timestamp": datetime.utcnow().isoformat()
        }
        logger.info(f"Audit: {audit_entry}")
        # In production, this would write to an audit log table
