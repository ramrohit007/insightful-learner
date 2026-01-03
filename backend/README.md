# Insightful Learner Backend

FastAPI backend for AI-powered student performance analysis.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up PostgreSQL database:
```bash
# Create database
createdb insightful_learner

# Or using psql:
# psql -U postgres
# CREATE DATABASE insightful_learner;
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Initialize database:
```bash
python init_db.py
```

5. Run the server:
```bash
python run.py
# Or
uvicorn app.main:app --reload
```

## API Endpoints

- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/login-code` - Login with access code
- `POST /api/teachers/access-codes/generate` - Generate access code
- `POST /api/teachers/syllabus/upload` - Upload syllabus PDF
- `POST /api/students/answer-sheets/upload` - Upload answer sheet
- `GET /api/analytics/teacher/{id}/overview` - Teacher dashboard data
- `GET /api/analytics/student/{id}/performance` - Student performance data

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - Secret key for JWT tokens
- `OPENAI_API_KEY` - (Optional) OpenAI API key for better AI analysis
- `FRONTEND_URL` - Frontend URL for CORS

