"""
Database initialization script
Creates demo users and sets up the database
"""
from app.database import SessionLocal, engine, Base
from app.models import User
from sqlalchemy import text

# Simple password hashing for demo (in production use proper bcrypt)
def hash_password(password: str) -> str:
    # For demo purposes, we'll just store a simple hash
    # In production, use: from passlib.context import CryptContext
    import hashlib
    return hashlib.sha256(password.encode()).hexdigest()

def init_database():
    """Initialize database with demo accounts"""
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if users already exist
        existing_users = db.query(User).count()
        if existing_users > 0:
            print("Database already initialized")
            return
        
        # Create demo teacher
        teacher = User(
            email="teacher@demo.com",
            name="Dr. Sarah Johnson",
            password_hash=hash_password("teacher123"),
            role="teacher"
        )
        db.add(teacher)
        
        # Create demo students
        students = [
            {
                "email": "student1@demo.com",
                "name": "Alex Thompson",
                "student_id": "STU001",
                "password": "student123"
            },
            {
                "email": "student2@demo.com",
                "name": "Maria Garcia",
                "student_id": "STU002",
                "password": "student123"
            },
            {
                "email": "student3@demo.com",
                "name": "James Wilson",
                "student_id": "STU003",
                "password": "student123"
            }
        ]
        
        for student_data in students:
            student = User(
                email=student_data["email"],
                name=student_data["name"],
                password_hash=hash_password(student_data["password"]),
                role="student",
                student_id=student_data["student_id"]
            )
            db.add(student)
        
        db.commit()
        print("Database initialized successfully with demo accounts")
        
    except Exception as e:
        print(f"Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_database()

