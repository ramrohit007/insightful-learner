# Insightful Learner - Setup Guide

Complete setup instructions for the AI-powered student performance analysis platform.

## Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.9+
- PostgreSQL 12+ (or use Docker)
- (Optional) OpenAI API key for enhanced AI analysis

## Backend Setup

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Create virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Set up PostgreSQL database:**

   Option A: Using Docker (Recommended)
   ```bash
   # From project root
   docker-compose up -d postgres
   ```

   Option B: Manual setup
   ```bash
   createdb insightful_learner
   # Or using psql:
   # psql -U postgres
   # CREATE DATABASE insightful_learner;
   ```

5. **Configure environment variables:**
```bash
cp .env.example .env
# Edit .env with your database credentials:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/insightful_learner
# SECRET_KEY=your-secret-key-here
# OPENAI_API_KEY=your-openai-key-optional
```

6. **Initialize database:**
```bash
python init_db.py
```

7. **Run the backend server:**
```bash
python run.py
# Or
uvicorn app.main:app --reload
```

Backend will run on `http://localhost:8000`

## Frontend Setup

1. **Navigate to project root:**
```bash
cd ..  # If you're in backend directory
```

2. **Install dependencies:**
```bash
npm install
# Or
yarn install
```

3. **Configure environment:**
```bash
cp .env.example .env
# Edit .env:
# VITE_API_URL=http://localhost:8000
```

4. **Run the development server:**
```bash
npm run dev
```

Frontend will run on `http://localhost:8080`

## Demo Accounts

### Teacher
- Email: `teacher@demo.com`
- Password: `teacher123`

### Students
- Student 1: `student1@demo.com` / `student123` (ID: STU001)
- Student 2: `student2@demo.com` / `student123` (ID: STU002)
- Student 3: `student3@demo.com` / `student123` (ID: STU003)

## Usage Flow

1. **Teacher Login:**
   - Login with teacher credentials
   - Upload syllabus PDF (extracts topics automatically)
   - Generate access code for students (valid for 1 hour)
   - View analytics dashboard

2. **Student Login:**
   - Login with student credentials OR use access code + student ID
   - Enter access code from teacher
   - Upload answer sheet PDF
   - View personal performance analytics

## Features

- **PDF Processing:** Converts PDFs to text using pdfplumber/PyPDF2
- **AI Analysis:** 
  - Extracts topics from syllabus
  - Segments answer sheets into Q&A pairs
  - Analyzes topic understanding (uses OpenAI if available, fallback to pattern matching)
- **Analytics:**
  - Topic-wise performance comparison
  - Individual student insights
  - Class-wide statistics
  - Bar charts and visualizations

## Troubleshooting

1. **Database connection errors:**
   - Ensure PostgreSQL is running
   - Check DATABASE_URL in backend/.env
   - Verify database exists: `psql -l | grep insightful_learner`

2. **CORS errors:**
   - Ensure FRONTEND_URL in backend/.env matches your frontend URL
   - Check that both servers are running

3. **PDF processing errors:**
   - Ensure PDFs are not corrupted
   - Try with a different PDF file
   - Check backend logs for detailed error messages

4. **AI analysis not working:**
   - Without OpenAI API key, the system uses fallback pattern matching
   - For better results, add OPENAI_API_KEY to backend/.env
   - Free tier OpenAI API has rate limits

## Production Deployment

1. **Backend:**
   - Use production WSGI server (gunicorn)
   - Set proper SECRET_KEY
   - Configure database connection pooling
   - Set up proper logging

2. **Frontend:**
   - Build: `npm run build`
   - Serve with nginx or similar
   - Update VITE_API_URL to production backend URL

3. **Database:**
   - Use managed PostgreSQL service
   - Set up regular backups
   - Configure connection limits

## API Documentation

Once backend is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

