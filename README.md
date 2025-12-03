# Limira

**AI-Powered Patent Disclosure Platform**

Limira is a secure web platform where inventors upload technical disclosures, and the system uses AI to convert them into structured, lawyer-ready patent drafts. Patent attorneys can review, edit, comment, and collaborate with inventors.

---

## Features (MVP)

### 🔬 Inventor Portal
- Create and manage technical disclosures
- Structured disclosure form (problem → solution → technical details)
- Upload supporting files (drawings, documents, images)
- Track disclosure status
- Collaborate with patent attorneys via comments

### 🤖 AI Structuring Engine
- Automatically extracts invention elements using LLM
- Produces first-pass structured patent draft
- Organizes uploaded drawings (figure index)
- Generates editable sections: background, summary, details, claims

### ⚖️ Lawyer Review Dashboard
- View assigned disclosures
- Review AI-generated drafts
- Inline editor for patent sections
- Comment threads with inventors
- Approve or request revisions

### 🔄 Version Control
- Lightweight versioned document states
- Track who edited what with timestamps

### 💬 Collaboration System
- Comment threads
- Real-time notifications
- Update history

---

## Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL 15+
- **ORM**: SQLAlchemy 2.0 (async)
- **Authentication**: JWT (python-jose)
- **AI/LLM**: OpenAI API / Anthropic Claude
- **File Storage**: Local (MVP) → AWS S3 (production)

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context + hooks
- **HTTP Client**: Axios
- **Routing**: React Router v6

---

## Project Structure

```
Limira/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/    # API route handlers
│   │   ├── core/                # Config, database, security
│   │   ├── models/              # SQLAlchemy models
│   │   ├── schemas/             # Pydantic schemas
│   │   ├── services/            # Business logic (AI, files, etc.)
│   │   ├── tasks/               # Background tasks
│   │   └── main.py              # FastAPI app entry point
│   ├── alembic/                 # Database migrations
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── pages/               # Page components
│   │   ├── services/            # API services
│   │   ├── context/             # React Context (AuthContext, etc.)
│   │   ├── types/               # TypeScript types
│   │   └── main.tsx             # Entry point
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

---

## Getting Started

### Prerequisites
- **Python 3.11+**
- **Node.js 18+**
- **PostgreSQL 15+**
- **OpenAI API Key** or **Anthropic API Key**

---

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Create `.env` file**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure:
   - `SECRET_KEY` - Generate a secure random key (min 32 chars)
   - `DATABASE_URL` - PostgreSQL connection string
   - `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` - Your AI provider key
   - Other settings as needed

5. **Create database**
   ```bash
   createdb limira_db
   ```

6. **Run database migrations**
   ```bash
   alembic revision --autogenerate -m "Initial migration"
   alembic upgrade head
   ```

7. **Start the backend server**
   ```bash
   python -m app.main
   # or
   uvicorn app.main:app --reload
   ```

   Backend runs at: **http://localhost:8000**
   API docs: **http://localhost:8000/docs**

---

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env` file**
   ```bash
   cp .env.example .env
   ```

   Default values should work for local development:
   ```
   VITE_API_URL=http://localhost:8000/api/v1
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

   Frontend runs at: **http://localhost:5173**

---

## Usage

### 1. Create an Account
- Navigate to http://localhost:5173/signup
- Choose role: **Inventor** or **Patent Attorney**
- Fill in your details and sign up

### 2. Inventor Workflow
1. Login as Inventor
2. Click "New Disclosure"
3. Fill in the structured form:
   - Title
   - Problem statement
   - Solution overview
   - Technical details
   - Advantages
4. Upload supporting files (drawings, documents)
5. Submit disclosure
6. AI automatically processes and generates patent draft
7. Review AI-generated draft
8. Collaborate with assigned patent attorney via comments

### 3. Lawyer Workflow
1. Login as Patent Attorney
2. View assigned disclosures on dashboard
3. Click on a disclosure to review
4. View AI-generated patent draft
5. Edit sections inline
6. Add comments for inventor
7. Choose action:
   - **Approve** → Mark as approved
   - **Request Revisions** → Send back to inventor with feedback

---

## API Endpoints

### Authentication
- `POST /api/v1/auth/signup` - Create new user account
- `POST /api/v1/auth/login` - Login and get JWT tokens
- `POST /api/v1/auth/refresh` - Refresh access token

### Disclosures
- `GET /api/v1/disclosures/` - List disclosures (role-filtered)
- `POST /api/v1/disclosures/` - Create new disclosure
- `GET /api/v1/disclosures/{id}` - Get disclosure details
- `PATCH /api/v1/disclosures/{id}` - Update disclosure
- `GET /api/v1/disclosures/{id}/versions` - Get version history

### Patent Drafts
- `GET /api/v1/drafts/{disclosure_id}` - Get AI-generated draft
- `PATCH /api/v1/drafts/{id}/sections` - Edit draft section
- `POST /api/v1/drafts/{disclosure_id}/approve` - Approve draft
- `POST /api/v1/drafts/{disclosure_id}/request-revision` - Request revision

### Comments
- `GET /api/v1/comments/disclosures/{id}/comments` - Get all comments
- `POST /api/v1/comments/disclosures/{id}/comments` - Add comment
- `PATCH /api/v1/comments/{id}` - Update comment
- `DELETE /api/v1/comments/{id}` - Delete comment

### Files
- `POST /api/v1/files/upload/{disclosure_id}` - Upload file
- `GET /api/v1/files/disclosure/{disclosure_id}/files` - List files
- `GET /api/v1/files/{id}/download` - Download file

---

## Development Notes

### Database Models

**User** → Inventor, Lawyer, Admin roles
**Disclosure** → Technical disclosure with structured content (JSON)
**PatentDraft** → AI-generated patent sections
**DisclosureVersion** → Version control snapshots
**File** → Uploaded files (drawings, documents)
**Comment** → Collaboration comments (threaded)
**Notification** → User notifications

### Authentication & Authorization

- **JWT** tokens (access + refresh)
- **Role-based access control** (RBAC)
  - Inventors can only see their own disclosures
  - Lawyers see assigned disclosures
  - Admins see everything

### AI Integration

- Uses OpenAI GPT-4 or Anthropic Claude
- Prompts engineered for patent draft generation
- Structured JSON output for patent sections
- Background task processing (async)

### File Upload

- MVP: Local file storage (`uploads/` directory)
- Production: AWS S3 with signed URLs
- Allowed types: PDF, PNG, JPG, JPEG, DOCX
- Max size: 10MB per file

---

## Next Steps (Post-MVP)

- [ ] Real-time WebSocket notifications
- [ ] Video chat with AI transcription
- [ ] Advanced rich text editor (TipTap/ProseMirror)
- [ ] Document comparison (diff viewer)
- [ ] Email notifications
- [ ] Admin dashboard with analytics
- [ ] Export to Word/PDF
- [ ] Mobile responsive design improvements
- [ ] Unit and integration tests

---

## Environment Variables

### Backend (.env)
```bash
# Application
APP_NAME=Limira
ENVIRONMENT=development
SECRET_KEY=your-secret-key-min-32-chars

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/limira_db

# AI
OPENAI_API_KEY=sk-...
# or
ANTHROPIC_API_KEY=sk-ant-...
PRIMARY_LLM_PROVIDER=openai

# CORS
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:8000/api/v1
```

---

## License

Proprietary - All rights reserved

---

## Contact

For questions or support, contact the development team.
