from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models import User, AccessCode, Syllabus
from app.services.pdf_service import PDFService
from app.services.ai_service import AIService
from datetime import datetime, timedelta
import os
import uuid
import json

router = APIRouter()
pdf_service = PDFService()
ai_service = AIService()

def get_teacher(user_id: int, db: Session):
    user = db.query(User).filter(User.id == user_id, User.role == "teacher").first()
    if not user:
        raise HTTPException(status_code=403, detail="Teacher access required")
    return user

class AccessCodeResponse(BaseModel):
    code: str
    expires_at: str
    created_at: str

class GenerateCodeRequest(BaseModel):
    teacher_id: int

@router.post("/access-codes/generate")
async def generate_access_code(
    request: GenerateCodeRequest,
    db: Session = Depends(get_db)
):
    """Generate a new access code for students (valid for 1 hour)"""
    teacher = get_teacher(request.teacher_id, db)
    
    # Generate 6-character code
    import random
    import string
    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    
    # Create access code
    access_code = AccessCode(
        code=code,
        teacher_id=teacher.id,
        expires_at=datetime.utcnow() + timedelta(hours=1),
        is_active=True
    )
    db.add(access_code)
    db.commit()
    db.refresh(access_code)
    
    return {
        "code": code,
        "expires_at": access_code.expires_at.isoformat(),
        "created_at": access_code.created_at.isoformat()
    }

@router.get("/access-codes")
async def get_active_codes(
    teacher_id: int,
    db: Session = Depends(get_db)
):
    """Get all active access codes for a teacher"""
    teacher = get_teacher(teacher_id, db)
    
    codes = db.query(AccessCode).filter(
        AccessCode.teacher_id == teacher.id,
        AccessCode.is_active == True,
        AccessCode.expires_at > datetime.utcnow()
    ).all()
    
    return [{
        "code": code.code,
        "expires_at": code.expires_at.isoformat(),
        "created_at": code.created_at.isoformat()
    } for code in codes]

@router.post("/syllabus/upload")
async def upload_syllabus(
    teacher_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload syllabus PDF and extract topics"""
    teacher = get_teacher(teacher_id, db)
    
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Save file
    file_id = str(uuid.uuid4())
    file_path = f"uploads/syllabus/{file_id}_{file.filename}"
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    try:
        # Extract text
        text_content = pdf_service.extract_text_from_pdf(file_path)
        
        # Save text version
        text_path = f"uploads/text/syllabus_{file_id}.txt"
        pdf_service.save_text_to_file(text_content, text_path)
        
        # Extract topics using AI
        topics = ai_service.extract_topics_from_syllabus(text_content)
        
        # Save to database
        syllabus = Syllabus(
            teacher_id=teacher.id,
            file_path=file_path,
            text_content=text_content,
            topics=topics
        )
        db.add(syllabus)
        db.commit()
        db.refresh(syllabus)
        
        return {
            "id": syllabus.id,
            "topics": topics,
            "message": "Syllabus uploaded and processed successfully"
        }
    except Exception as e:
        # Clean up on error
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Error processing syllabus: {str(e)}")

@router.get("/syllabus")
async def get_syllabus(
    teacher_id: int,
    db: Session = Depends(get_db)
):
    """Get teacher's syllabus"""
    teacher = get_teacher(teacher_id, db)
    
    syllabus = db.query(Syllabus).filter(
        Syllabus.teacher_id == teacher.id
    ).order_by(Syllabus.created_at.desc()).first()
    
    if not syllabus:
        return {"message": "No syllabus uploaded yet"}
    
    return {
        "id": syllabus.id,
        "topics": syllabus.topics or [],
        "created_at": syllabus.created_at.isoformat()
    }

