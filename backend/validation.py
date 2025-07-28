import re
import logging
from typing import List, Optional, Tuple
from pydantic import BaseModel, validator

logger = logging.getLogger(__name__)

class SMILESValidator:
    """Validate and sanitize SMILES strings"""
    
    # Basic SMILES pattern - allows common chemical elements and symbols
    SMILES_PATTERN = re.compile(r'^[A-Za-z0-9()[\]{}@+\-=\#$%:;.,]+$')
    
    # Maximum length to prevent DoS attacks
    MAX_SMILES_LENGTH = 1000
    
    @classmethod
    def validate_smiles(cls, smiles: str) -> Tuple[bool, str]:
        """Validate a SMILES string and return (is_valid, error_message)"""
        if not smiles or not isinstance(smiles, str):
            return False, "SMILES must be a non-empty string"
        
        # Check length
        if len(smiles) > cls.MAX_SMILES_LENGTH:
            return False, f"SMILES too long (max {cls.MAX_SMILES_LENGTH} characters)"
        
        # Check for valid characters
        if not cls.SMILES_PATTERN.match(smiles):
            return False, "SMILES contains invalid characters"
        
        # Check for balanced parentheses
        if not cls._check_balanced_parentheses(smiles):
            return False, "SMILES has unbalanced parentheses"
        
        return True, ""
    
    @classmethod
    def _check_balanced_parentheses(cls, smiles: str) -> bool:
        """Check if parentheses are balanced"""
        stack = []
        for char in smiles:
            if char in '([{':
                stack.append(char)
            elif char in ')]}':
                if not stack:
                    return False
                if (char == ')' and stack[-1] == '(') or \
                   (char == ']' and stack[-1] == '[') or \
                   (char == '}' and stack[-1] == '{'):
                    stack.pop()
                else:
                    return False
        return len(stack) == 0
    
    @classmethod
    def sanitize_smiles(cls, smiles: str) -> str:
        """Sanitize SMILES string by removing potentially dangerous characters"""
        if not smiles:
            return ""
        
        # Remove any non-SMILES characters
        sanitized = re.sub(r'[^A-Za-z0-9()[\]{}@+\-=\#$%:;.,]', '', smiles)
        
        # Limit length
        if len(sanitized) > cls.MAX_SMILES_LENGTH:
            sanitized = sanitized[:cls.MAX_SMILES_LENGTH]
        
        return sanitized

class EmailValidator:
    """Validate email addresses"""
    
    EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    
    @classmethod
    def validate_email(cls, email: str) -> Tuple[bool, str]:
        """Validate email format"""
        if not email or not isinstance(email, str):
            return False, "Email must be a non-empty string"
        
        if len(email) > 254:  # RFC 5321 limit
            return False, "Email too long"
        
        if not cls.EMAIL_PATTERN.match(email):
            return False, "Invalid email format"
        
        return True, ""
    
    @classmethod
    def sanitize_email(cls, email: str) -> str:
        """Sanitize email by converting to lowercase and trimming"""
        if not email:
            return ""
        
        return email.lower().strip()

class PasswordValidator:
    """Validate password strength"""
    
    MIN_LENGTH = 8
    MAX_LENGTH = 128
    
    @classmethod
    def validate_password(cls, password: str) -> Tuple[bool, str]:
        """Validate password strength"""
        if not password or not isinstance(password, str):
            return False, "Password must be a non-empty string"
        
        if len(password) < cls.MIN_LENGTH:
            return False, f"Password must be at least {cls.MIN_LENGTH} characters"
        
        if len(password) > cls.MAX_LENGTH:
            return False, f"Password too long (max {cls.MAX_LENGTH} characters)"
        
        # Check for common weak patterns
        if password.lower() in ['password', '123456', 'admin', 'test']:
            return False, "Password is too common"
        
        return True, ""

class InputSanitizer:
    """General input sanitization utilities"""
    
    @staticmethod
    def sanitize_string(value: str, max_length: int = 100) -> str:
        """Sanitize a string input"""
        if not value:
            return ""
        
        # Remove control characters
        sanitized = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', str(value))
        
        # Limit length
        if len(sanitized) > max_length:
            sanitized = sanitized[:max_length]
        
        return sanitized.strip()
    
    @staticmethod
    def sanitize_integer(value: any, min_val: int = 0, max_val: int = 1000000) -> Optional[int]:
        """Sanitize and validate integer input"""
        try:
            int_val = int(value)
            if min_val <= int_val <= max_val:
                return int_val
            return None
        except (ValueError, TypeError):
            return None 