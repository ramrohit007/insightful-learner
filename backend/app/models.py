from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy import TypeDecorator
import json
from app.database import Base

# JSON type for SQLite compatibility
class JSONType(TypeDecorator):
    impl = Text
    cache_ok = True
    
    def process_bind_param(self, value, dialect):
        if value is not None:
            return json.dumps(value)
        return value
    
    def process_result_value(self, value, dialect):
        if value is not None:
            return json.loads(value)
        return value

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    password_hash = Column(String)
    role = Column(String)  # "teacher" or "student"
    student_id = Column(String, unique=True, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    access_codes = relationship("AccessCode", back_populates="teacher", foreign_keys="AccessCode.teacher_id")
    answer_sheets = relationship("AnswerSheet", back_populates="student")
    syllabus = relationship("Syllabus", back_populates="teacher", foreign_keys="Syllabus.teacher_id")

class AccessCode(Base):
    __tablename__ = "access_codes"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"))
    expires_at = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())
    is_active = Column(Boolean, default=True)
    
    teacher = relationship("User", back_populates="access_codes", foreign_keys=[teacher_id])

class Syllabus(Base):
    __tablename__ = "syllabus"
    
    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"))
    file_path = Column(String)
    text_content = Column(Text)
    topics = Column(JSONType)  # List of extracted topics
    created_at = Column(DateTime, server_default=func.now())
    
    teacher = relationship("User", back_populates="syllabus", foreign_keys=[teacher_id])
    analyses = relationship("Analysis", back_populates="syllabus")

class AnswerSheet(Base):
    __tablename__ = "answer_sheets"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"))
    access_code = Column(String)
    file_path = Column(String)
    text_content = Column(Text)
    questions_answers = Column(JSONType)  # Segmented Q&A
    status = Column(String, default="processing")  # processing, processed, error
    created_at = Column(DateTime, server_default=func.now())
    processed_at = Column(DateTime, nullable=True)
    
    student = relationship("User", back_populates="answer_sheets")
    analyses = relationship("Analysis", back_populates="answer_sheet")

class Analysis(Base):
    __tablename__ = "analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    answer_sheet_id = Column(Integer, ForeignKey("answer_sheets.id"))
    syllabus_id = Column(Integer, ForeignKey("syllabus.id"))
    topic = Column(String)
    understanding_score = Column(Float)  # 0-100
    confidence = Column(Float)  # 0-1
    details = Column(JSONType)  # Additional analysis details
    created_at = Column(DateTime, server_default=func.now())
    
    answer_sheet = relationship("AnswerSheet", back_populates="analyses")
    syllabus = relationship("Syllabus", back_populates="analyses")

