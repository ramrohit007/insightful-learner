# Insightful Learner

An AI-powered platform for analyzing student performance and understanding of topics using exam answer sheets. The system processes PDF answer sheets, extracts topics from syllabus, and provides detailed analytics on student comprehension.

## Features

- **PDF Processing**: Converts PDF answer sheets and syllabus documents to text
- **AI-Powered Analysis**: 
  - Extracts topics from syllabus documents
  - Segments answer sheets into question-answer pairs
  - Analyzes student understanding per topic
- **Teacher Dashboard**: 
  - Upload syllabus PDFs
  - Generate time-limited access codes for students
  - View comprehensive analytics and student performance comparisons
  - Topic-wise bar charts and statistics
- **Student Dashboard**:
  - Upload answer sheets using access codes
  - View personal performance metrics
  - Compare performance with class averages
  - Identify strong topics and areas for improvement
- **Secure Authentication**: 
  - Email/password login for teachers and students
  - Access code-based login for students
  - Demo accounts included

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite
- Tailwind CSS
- Shadcn UI components
- Recharts for data visualization
- React Router for navigation

### Backend
- FastAPI (Python)
- PostgreSQL database
- SQLAlchemy ORM
- PDF processing (pdfplumber, PyPDF2)
- AI analysis (OpenAI API with fallback pattern matching)

## Quick Start

See [SETUP.md](./SETUP.md) for detailed setup instructions.

### Prerequisites
- Node.js 18+
- Python 3.9+
- PostgreSQL 12+ (or Docker)

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set up database (using Docker)
docker-compose up -d postgres

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Initialize database
python init_db.py

# Run server
python run.py
```

### Frontend Setup
```bash
npm install
cp .env.example .env
# Edit .env: VITE_API_URL=http://localhost:8000
npm run dev
```

## Demo Accounts

### Teacher
- Email: `teacher@demo.com`
- Password: `teacher123`

### Students
- Student 1: `student1@demo.com` / `student123` (ID: STU001)
- Student 2: `student2@demo.com` / `student123` (ID: STU002)
- Student 3: `student3@demo.com` / `student123` (ID: STU003)

## Usage Flow

1. **Teacher Workflow:**
   - Login with teacher credentials
   - Upload syllabus PDF (topics are automatically extracted)
   - Generate access code (valid for 1 hour)
   - Share code with students
   - View analytics dashboard with student performance

2. **Student Workflow:**
   - Login with student credentials OR use access code + student ID
   - Enter access code from teacher
   - Upload answer sheet PDF
   - View personal performance analytics

## Project Structure

```
insightful-learner/
├── backend/
│   ├── app/
│   │   ├── routers/        # API endpoints
│   │   ├── services/       # Business logic (PDF, AI)
│   │   ├── models.py       # Database models
│   │   ├── database.py     # DB configuration
│   │   └── main.py         # FastAPI app
│   ├── init_db.py          # Database initialization
│   ├── run.py              # Server entry point
│   └── requirements.txt    # Python dependencies
├── src/
│   ├── components/         # React components
│   ├── contexts/          # React contexts (Auth)
│   ├── lib/               # Utilities and API client
│   ├── pages/             # Page components
│   └── App.tsx            # Main app component
├── docker-compose.yml     # PostgreSQL container
└── SETUP.md              # Detailed setup guide
```

## API Endpoints

- `POST /api/auth/login` - Email/password login
- `POST /api/auth/login-code` - Access code login
- `POST /api/teachers/access-codes/generate` - Generate access code
- `POST /api/teachers/syllabus/upload` - Upload syllabus
- `POST /api/students/answer-sheets/upload` - Upload answer sheet
- `GET /api/analytics/teacher/{id}/overview` - Teacher dashboard data
- `GET /api/analytics/student/{id}/performance` - Student performance
- `GET /api/analytics/teacher/{id}/topic-comparison` - Topic comparison data

See API docs at `http://localhost:8000/docs` when backend is running.

## AI Analysis

The system uses AI to:
1. **Extract Topics**: From syllabus PDFs using pattern matching or OpenAI
2. **Segment Q&A**: Break answer sheets into question-answer pairs
3. **Analyze Understanding**: Score student comprehension per topic (0-100%)

**Without OpenAI API Key**: Uses intelligent pattern matching and keyword analysis
**With OpenAI API Key**: Provides more accurate topic extraction and understanding analysis

Add `OPENAI_API_KEY` to `backend/.env` for enhanced AI capabilities.

## Database Schema

- **users**: Teachers and students
- **access_codes**: Time-limited student access codes
- **syllabus**: Uploaded syllabus documents and extracted topics
- **answer_sheets**: Student answer sheet uploads
- **analyses**: Topic-wise understanding scores

## Development

### Backend Development
```bash
cd backend
uvicorn app.main:app --reload
```

### Frontend Development
```bash
npm run dev
```

### Database Migrations
Currently using SQLAlchemy's `create_all()`. For production, consider using Alembic for migrations.

## Production Deployment

1. **Backend:**
   - Use gunicorn or uvicorn workers
   - Set proper SECRET_KEY
   - Configure database connection pooling
   - Set up logging and monitoring

2. **Frontend:**
   - Build: `npm run build`
   - Serve with nginx
   - Update API URL in environment

3. **Database:**
   - Use managed PostgreSQL
   - Set up backups
   - Configure connection limits

## License

This project is provided as-is for educational purposes.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
