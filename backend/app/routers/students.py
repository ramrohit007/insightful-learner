from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, AnswerSheet, AccessCode
from app.services.pdf_service import PDFService
from app.services.ai_service import AIService
from datetime import datetime
import os
import uuid

router = APIRouter()
pdf_service = PDFService()
ai_service = AIService()

def get_student(user_id: int, db: Session):
    user = db.query(User).filter(User.id == user_id, User.role == "student").first()
    if not user:
        raise HTTPException(status_code=403, detail="Student access required")
    return user

@router.post("/answer-sheets/upload")
async def upload_answer_sheet(
    student_id: int,
    access_code: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload answer sheet PDF"""
    student = get_student(student_id, db)
    
    # Validate access code
    access_code_obj = db.query(AccessCode).filter(
        AccessCode.code == access_code.upper(),
        AccessCode.is_active == True
    ).first()
    
    if not access_code_obj:
        raise HTTPException(status_code=401, detail="Invalid access code")
    
    if datetime.utcnow() > access_code_obj.expires_at:
        raise HTTPException(status_code=401, detail="Access code has expired")
    
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Save file
    file_id = str(uuid.uuid4())
    file_path = f"uploads/answers/{file_id}_{file.filename}"
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    try:
        # Extract text
        text_content = pdf_service.extract_text_from_pdf(file_path)
        
        # Save text version
        text_path = f"uploads/text/answer_{file_id}.txt"
        pdf_service.save_text_to_file(text_content, text_path)
        
        # Segment into Q&A pairs
        qa_pairs = ai_service.segment_qa_from_answer_sheet(text_content)
        
        # Create answer sheet record
        answer_sheet = AnswerSheet(
            student_id=student.id,
            access_code=access_code.upper(),
            file_path=file_path,
            text_content=text_content,
            questions_answers=qa_pairs,
            status="processing"
        )
        db.add(answer_sheet)
        db.commit()
        db.refresh(answer_sheet)
        
        # Process analysis asynchronously (in production, use background tasks)
        # For now, process immediately
        try:
            from app.routers.analytics import process_answer_sheet_analysis
            process_answer_sheet_analysis(answer_sheet.id, db)
        except Exception as e:
            print(f"Error processing analysis: {e}")
            # Analysis will be processed later
        
        return {
            "id": answer_sheet.id,
            "status": "processing",
            "message": "Answer sheet uploaded and is being processed"
        }
    except Exception as e:
        # Clean up on error
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Error processing answer sheet: {str(e)}")

@router.get("/answer-sheets")
async def get_answer_sheets(
    student_id: int,
    db: Session = Depends(get_db)
):
    """Get student's answer sheets"""
    student = get_student(student_id, db)
    
    sheets = db.query(AnswerSheet).filter(
        AnswerSheet.student_id == student.id
    ).order_by(AnswerSheet.created_at.desc()).all()
    
    return [{
        "id": sheet.id,
        "file_name": os.path.basename(sheet.file_path),
        "status": sheet.status,
        "created_at": sheet.created_at.isoformat(),
        "processed_at": sheet.processed_at.isoformat() if sheet.processed_at else None
    } for sheet in sheets]

