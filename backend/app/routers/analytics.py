from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import User, Analysis, AnswerSheet, Syllabus
from app.services.ai_service import AIService
from datetime import datetime
from typing import List, Dict, Any

router = APIRouter()
ai_service = AIService()

def process_answer_sheet_analysis(answer_sheet_id: int, db: Session):
    """Process answer sheet and create analyses"""
    answer_sheet = db.query(AnswerSheet).filter(AnswerSheet.id == answer_sheet_id).first()
    if not answer_sheet:
        return
    
    # Get teacher's syllabus (for now, get the most recent one)
    # In production, link answer sheets to specific syllabi
    syllabus = db.query(Syllabus).order_by(Syllabus.created_at.desc()).first()
    
    if not syllabus or not syllabus.topics:
        answer_sheet.status = "error"
        db.commit()
        return
    
    # Get Q&A pairs
    qa_pairs = answer_sheet.questions_answers or []
    if not qa_pairs:
        answer_sheet.status = "error"
        db.commit()
        return
    
    # Analyze understanding for each topic
    analyses_data = ai_service.analyze_topic_understanding(syllabus.topics, qa_pairs)
    
    # Create analysis records
    for analysis_data in analyses_data:
        analysis = Analysis(
            answer_sheet_id=answer_sheet.id,
            syllabus_id=syllabus.id,
            topic=analysis_data["topic"],
            understanding_score=analysis_data["understanding_score"],
            confidence=analysis_data.get("confidence", 0.5),
            details=analysis_data.get("details", {})
        )
        db.add(analysis)
    
    answer_sheet.status = "processed"
    answer_sheet.processed_at = datetime.utcnow()
    db.commit()

@router.get("/teacher/{teacher_id}/overview")
async def get_teacher_overview(
    teacher_id: int,
    db: Session = Depends(get_db)
):
    """Get teacher dashboard overview"""
    teacher = db.query(User).filter(User.id == teacher_id, User.role == "teacher").first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    # Get all students
    students = db.query(User).filter(User.role == "student").all()
    
    # Get all analyses
    analyses = db.query(Analysis).join(AnswerSheet).filter(
        AnswerSheet.student_id.in_([s.id for s in students])
    ).all()
    
    # Get syllabus topics
    syllabus = db.query(Syllabus).filter(Syllabus.teacher_id == teacher.id).order_by(Syllabus.created_at.desc()).first()
    topics = syllabus.topics if syllabus else []
    
    # Calculate statistics
    topic_stats = {}
    for topic in topics:
        topic_analyses = [a for a in analyses if a.topic == topic]
        if topic_analyses:
            avg_score = sum(a.understanding_score for a in topic_analyses) / len(topic_analyses)
            topic_stats[topic] = {
                "average": round(avg_score, 1),
                "student_scores": {}
            }
            
            # Get scores per student
            for student in students:
                student_analyses = [
                    a for a in topic_analyses 
                    if a.answer_sheet.student_id == student.id
                ]
                if student_analyses:
                    student_avg = sum(a.understanding_score for a in student_analyses) / len(student_analyses)
                    topic_stats[topic]["student_scores"][student.name] = round(student_avg, 1)
    
    # Get recent uploads
    recent_uploads = db.query(AnswerSheet).join(User).filter(
        User.role == "student"
    ).order_by(AnswerSheet.created_at.desc()).limit(10).all()
    
    return {
        "total_students": len(students),
        "topics_analyzed": len(topics),
        "average_understanding": round(
            sum(a.understanding_score for a in analyses) / len(analyses) if analyses else 0,
            1
        ),
        "pending_analysis": len([s for s in recent_uploads if s.status == "processing"]),
        "topic_statistics": topic_stats,
        "recent_uploads": [{
            "id": upload.id,
            "student_name": upload.student.name,
            "file_name": upload.file_path.split("/")[-1],
            "status": upload.status,
            "upload_date": upload.created_at.isoformat()
        } for upload in recent_uploads]
    }

@router.get("/student/{student_id}/performance")
async def get_student_performance(
    student_id: int,
    db: Session = Depends(get_db)
):
    """Get student performance data"""
    student = db.query(User).filter(User.id == student_id, User.role == "student").first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get all analyses for this student
    analyses = db.query(Analysis).join(AnswerSheet).filter(
        AnswerSheet.student_id == student.id
    ).all()
    
    # Group by topic
    topic_scores = {}
    for analysis in analyses:
        if analysis.topic not in topic_scores:
            topic_scores[analysis.topic] = []
        topic_scores[analysis.topic].append(analysis.understanding_score)
    
    # Calculate averages
    topic_averages = {
        topic: round(sum(scores) / len(scores), 1)
        for topic, scores in topic_scores.items()
    }
    
    # Get class averages for comparison
    all_analyses = db.query(Analysis).join(AnswerSheet).all()
    class_topic_scores = {}
    for analysis in all_analyses:
        if analysis.topic not in class_topic_scores:
            class_topic_scores[analysis.topic] = []
        class_topic_scores[analysis.topic].append(analysis.understanding_score)
    
    class_averages = {
        topic: round(sum(scores) / len(scores), 1)
        for topic, scores in class_topic_scores.items()
    }
    
    overall_average = round(
        sum(topic_averages.values()) / len(topic_averages) if topic_averages else 0,
        1
    )
    
    strong_topics = [topic for topic, score in topic_averages.items() if score >= 80]
    weak_topics = [topic for topic, score in topic_averages.items() if score < 65]
    
    return {
        "student_name": student.name,
        "overall_average": overall_average,
        "topic_scores": topic_averages,
        "class_averages": class_averages,
        "strong_topics": strong_topics,
        "weak_topics": weak_topics
    }

@router.get("/teacher/{teacher_id}/topic-comparison")
async def get_topic_comparison(
    teacher_id: int,
    db: Session = Depends(get_db)
):
    """Get topic comparison data for charts"""
    teacher = db.query(User).filter(User.id == teacher_id, User.role == "teacher").first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    # Get syllabus topics
    syllabus = db.query(Syllabus).filter(Syllabus.teacher_id == teacher.id).order_by(Syllabus.created_at.desc()).first()
    if not syllabus:
        return {"topics": [], "data": []}
    
    topics = syllabus.topics or []
    
    # Get all students
    students = db.query(User).filter(User.role == "student").all()
    
    # Get all analyses
    all_analyses = db.query(Analysis).join(AnswerSheet).all()
    
    # Build chart data
    chart_data = []
    for topic in topics:
        topic_data = {"topic": topic}
        
        # Get average for topic
        topic_analyses = [a for a in all_analyses if a.topic == topic]
        if topic_analyses:
            avg = sum(a.understanding_score for a in topic_analyses) / len(topic_analyses)
            topic_data["average"] = round(avg, 1)
        else:
            topic_data["average"] = 0
        
        # Get scores per student
        for student in students:
            student_analyses = [
                a for a in topic_analyses
                if a.answer_sheet.student_id == student.id
            ]
            if student_analyses:
                student_avg = sum(a.understanding_score for a in student_analyses) / len(student_analyses)
                topic_data[student.name.split()[0]] = round(student_avg, 1)
            else:
                topic_data[student.name.split()[0]] = 0
        
        chart_data.append(topic_data)
    
    return {
        "topics": topics,
        "data": chart_data,
        "students": [s.name.split()[0] for s in students]
    }

