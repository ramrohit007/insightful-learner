from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models import User
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import JWTError, jwt
import os

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"

class LoginRequest(BaseModel):
    email: str
    password: str

class CodeLoginRequest(BaseModel):
    access_code: str
    student_id: str

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str
    student_id: str | None = None

    class Config:
        from_attributes = True

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Simple hash verification for demo
    import hashlib
    return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password

def get_password_hash(password: str) -> str:
    # Simple hash for demo
    import hashlib
    return hashlib.sha256(password.encode()).hexdigest()

@router.post("/login", response_model=UserResponse)
async def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """Login with email and password"""
    user = db.query(User).filter(User.email == credentials.email).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # For demo accounts, use simple password check
    # In production, use hashed passwords
    demo_passwords = {
        "teacher@demo.com": "teacher123",
        "student1@demo.com": "student123",
        "student2@demo.com": "student123",
        "student3@demo.com": "student123",
    }
    
    if credentials.email in demo_passwords:
        if credentials.password != demo_passwords[credentials.email]:
            raise HTTPException(status_code=401, detail="Invalid credentials")
    elif not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return user

@router.post("/login-code", response_model=UserResponse)
async def login_with_code(credentials: CodeLoginRequest, db: Session = Depends(get_db)):
    """Login with access code and student ID"""
    from app.models import AccessCode
    
    # Validate access code
    access_code = db.query(AccessCode).filter(
        AccessCode.code == credentials.access_code.upper(),
        AccessCode.is_active == True
    ).first()
    
    if not access_code:
        raise HTTPException(status_code=401, detail="Invalid or expired access code")
    
    if datetime.utcnow() > access_code.expires_at:
        access_code.is_active = False
        db.commit()
        raise HTTPException(status_code=401, detail="Access code has expired")
    
    # Find student
    user = db.query(User).filter(
        User.student_id == credentials.student_id.upper(),
        User.role == "student"
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")
    
    return user

@router.get("/me", response_model=UserResponse)
async def get_current_user(user_id: int, db: Session = Depends(get_db)):
    """Get current user info"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

