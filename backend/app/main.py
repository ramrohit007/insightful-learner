from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.database import engine, Base
from app.routers import auth, teachers, students, files, analytics

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Insightful Learner API",
    description="AI-powered student performance analysis platform",
    version="1.0.0"
)

# CORS configuration
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:8080")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploaded PDFs
os.makedirs("uploads", exist_ok=True)
os.makedirs("uploads/syllabus", exist_ok=True)
os.makedirs("uploads/answers", exist_ok=True)
os.makedirs("uploads/text", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(teachers.router, prefix="/api/teachers", tags=["teachers"])
app.include_router(students.router, prefix="/api/students", tags=["students"])
app.include_router(files.router, prefix="/api/files", tags=["files"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])

@app.get("/")
async def root():
    return {"message": "Insightful Learner API", "status": "running"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

