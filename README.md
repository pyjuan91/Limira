# Limira - AI-Powered Patent Disclosure Platform

An intelligent web platform that transforms inventor disclosures into structured, lawyer-ready patent drafts using AI. Patent attorneys can review, edit, and collaborate with inventors seamlessly.

🌐 **Live Demo**: [https://limira.vercel.app](https://limira.vercel.app)  
📚 **API Docs**: [https://limira-backend.onrender.com/docs](https://limira-backend.onrender.com/docs)

---

## 🚀 Quick Start - Try the Live Demo

### Step 1: Check Backend Status

Before using the application, verify the backend is awake (Render free tier sleeps after 15 minutes of inactivity):

```bash
# Check backend health
curl https://limira-backend.onrender.com/health

# Expected response: {"status":"healthy"}
# First request may take 30-60 seconds if backend was sleeping
```

Or visit in your browser:
```
https://limira-backend.onrender.com/health
```

**Wait for the backend to respond** before proceeding (initial cold start: ~30-60 seconds).

---

### Step 2: Access the Application

Visit: **https://limira.vercel.app**

---

### Step 3: Create an Account

1. Click **"Sign up"**
2. Fill in your details:
   - **Email**: your-email@example.com
   - **Password**: your-password
   - **Full Name**: Your Name
   - **Company**: Optional
   - **Role**: Choose `INVENTOR` or `LAWYER`
3. Click **"Sign Up"**
4. You'll be automatically logged in and redirected to your dashboard

---

### Step 4: Explore Features

#### As an Inventor:
- Create new invention disclosures
- Upload supporting documents
- Track AI processing status
- Collaborate with patent attorneys via comments

#### As a Lawyer:
- Review assigned disclosures
- View AI-generated patent drafts
- Edit draft sections inline
- Provide feedback to inventors

---

## 💻 Local Development Setup

### Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **PostgreSQL 15+**
- **OpenAI API Key** (get from [OpenAI Platform](https://platform.openai.com/api-keys))
- **UV** (recommended) or pip for Python package management

---

### Backend Setup

#### 1. Install PostgreSQL (if not installed)

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Verify installation:**
```bash
psql --version
# Expected: psql (PostgreSQL) 15.x
```

---

#### 2. Clone and Setup Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies (using UV - recommended)
uv pip install -r requirements.txt

# Alternative: using traditional pip
# python -m venv venv
# source venv/bin/activate
# pip install -r requirements.txt
```

---

#### 3. Configure Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit .env and configure:
nano .env
```

**Required variables:**
```bash
# Application
SECRET_KEY=your-super-secret-key-min-32-characters
DATABASE_URL=postgresql://localhost:5432/limira_db

# AI Provider
OPENAI_API_KEY=sk-proj-your-openai-api-key
PRIMARY_LLM_PROVIDER=openai

# Environment
ENVIRONMENT=development
DEBUG=True
```

**Generate a secure SECRET_KEY:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

#### 4. Create Database

```bash
# Create PostgreSQL database
createdb limira_db

# If createdb not found, add PostgreSQL to PATH:
# echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
# source ~/.zshrc
```

---

#### 5. Run Database Migrations

```bash
# Apply database migrations
uv run alembic upgrade head

# Alternative without UV:
# alembic upgrade head
```

Expected output:
```
INFO  [alembic.runtime.migration] Running upgrade  -> ..., Initial migration
```

---

#### 6. Start Backend Server

```bash
# Start with UV (recommended)
uv run uvicorn app.main:app --reload

# Alternative:
# uvicorn app.main:app --reload
```

**Backend will run at**: http://localhost:8000  
**API Documentation**: http://localhost:8000/docs

**Expected startup logs:**
```
✅ Created test inventor account: inventor@test.com / password123
✅ Created test attorney account: attorney@test.com / password123
INFO:     Uvicorn running on http://127.0.0.1:8000
```

---

### Frontend Setup

#### 1. Install Dependencies

**Open a new terminal** (keep backend running), then:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

---

#### 2. Configure Environment

```bash
# Copy example env file
cp .env.example .env
```

**Verify `.env` contains:**
```bash
VITE_API_URL=http://localhost:8000/api/v1
```

---

#### 3. Start Frontend Server

```bash
npm run dev
```

**Frontend will run at**: http://localhost:5173

Expected output:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

---

### 🧪 Test Local Installation

1. **Open browser**: http://localhost:5173
2. **Sign up** for a new account
3. **Create a disclosure** (as Inventor)
4. **Review drafts** (as Lawyer)

---

## 🎯 Daily Development Workflow

```bash
# Terminal 1 - Backend
cd backend
uv run uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Then visit: **http://localhost:5173**

---

## 🏗️ Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL 15+ with SQLAlchemy 2.0 (async)
- **Authentication**: JWT tokens
- **AI/LLM**: OpenAI GPT-4 / Anthropic Claude
- **Migrations**: Alembic

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Routing**: React Router v6

---

## 📁 Project Structure

```
Limira/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/    # API routes
│   │   ├── core/                # Config, database, security
│   │   ├── models/              # SQLAlchemy models
│   │   ├── schemas/             # Pydantic schemas
│   │   ├── services/            # Business logic (AI, files)
│   │   └── main.py              # FastAPI entry point
│   ├── alembic/                 # Database migrations
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── pages/               # Page components
│   │   ├── services/            # API services
│   │   ├── context/             # React Context
│   │   └── types/               # TypeScript types
│   └── package.json
│
├── docs/                        # Deployment documentation
├── .github/workflows/           # CI/CD pipelines
└── README.md
```

---

## 🔐 Test Accounts (Auto-created on Startup)

The application automatically creates test accounts on first startup:

### Inventor Account
- **Email**: inventor@test.com
- **Password**: password123
- **Login**: http://localhost:5173/login/inventor

### Lawyer Account
- **Email**: attorney@test.com
- **Password**: password123
- **Login**: http://localhost:5173/login/attorney

> **Note**: Test accounts are created automatically. You can also register new accounts via the signup page.

---

## 🚢 Deployment

The application is deployed with automatic CI/CD:

- **Frontend**: Vercel (auto-deploy on push to `main`)
- **Backend**: Render (auto-deploy on push to `main`)
- **Database**: Render PostgreSQL
- **CI/CD**: GitHub Actions

**Every push to `main` branch automatically triggers deployment!**

For detailed deployment instructions, see:
- [Complete Deployment Guide](docs/DEPLOYMENT.md)
- [Quick Deployment Checklist](docs/DEPLOYMENT_CHECKLIST.md)

---

## 🛠️ Troubleshooting

### Backend Issues

**Database connection error:**
```bash
# Check PostgreSQL is running
brew services list | grep postgresql

# Restart if needed
brew services restart postgresql@15

# Verify database exists
psql -l | grep limira_db
```

**Migration errors:**
```bash
# Reset database (WARNING: deletes all data)
dropdb limira_db
createdb limira_db
uv run alembic upgrade head
```

**OpenAI API errors:**
- Verify your API key is valid
- Check you have available credits at https://platform.openai.com/account/usage

---

### Frontend Issues

**API connection errors:**
```bash
# Verify backend is running
curl http://localhost:8000/health

# Check frontend .env file
cat frontend/.env
# Should contain: VITE_API_URL=http://localhost:8000/api/v1
```

**Build errors:**
```bash
# Clear node_modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
```

---

### Live Demo Issues

**Backend not responding:**
- Wait 30-60 seconds for Render free tier to wake up
- Visit https://limira-backend.onrender.com/health to wake it up
- Check status at https://dashboard.render.com

**Login fails with "Incorrect email or password":**
- Register a new account instead of using test accounts
- Test accounts may not be available on first deployment

---

## 📚 API Documentation

### Interactive API Docs

**Local**: http://localhost:8000/docs  
**Live**: https://limira-backend.onrender.com/docs

### Key Endpoints

#### Authentication
- `POST /api/v1/auth/signup` - Register new user
- `POST /api/v1/auth/login` - Login and get JWT tokens
- `POST /api/v1/auth/refresh` - Refresh access token

#### Disclosures
- `GET /api/v1/disclosures/` - List disclosures (role-filtered)
- `POST /api/v1/disclosures/` - Create new disclosure
- `GET /api/v1/disclosures/{id}` - Get disclosure details
- `PATCH /api/v1/disclosures/{id}` - Update disclosure

#### Patent Drafts
- `GET /api/v1/drafts/{disclosure_id}` - Get AI-generated draft
- `PATCH /api/v1/drafts/{id}/sections` - Edit draft section

#### Comments
- `GET /api/v1/comments/disclosures/{id}/comments` - Get comments
- `POST /api/v1/comments/disclosures/{id}/comments` - Add comment

---

## 🔄 Database Management

### Create New Migration

```bash
cd backend
uv run alembic revision --autogenerate -m "Description of changes"
uv run alembic upgrade head
```

### Rollback Migration

```bash
uv run alembic downgrade -1  # Rollback one version
```

### View Migration History

```bash
uv run alembic history
uv run alembic current
```

---

## 🎨 Features

### For Inventors
- ✅ Create structured invention disclosures
- ✅ Upload supporting documents and drawings
- ✅ AI-powered patent draft generation
- ✅ Real-time collaboration with attorneys
- ✅ Track disclosure status

### For Patent Attorneys
- ✅ Review assigned disclosures
- ✅ AI-generated patent sections
- ✅ Inline editing capabilities
- ✅ Comment and feedback system
- ✅ Approve or request revisions

### AI Capabilities
- ✅ Automatic patent structure generation
- ✅ Claims drafting assistance
- ✅ Prior art analysis
- ✅ Technical detail extraction

---

## 🤝 Contributing

This is a private project. For questions or suggestions, contact the development team.

---

## 📄 License

Proprietary - All rights reserved

---

## 🆘 Support

### Documentation
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Deployment Checklist](docs/DEPLOYMENT_CHECKLIST.md)

### External Resources
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)

---

**Built with ❤️ for inventors and patent attorneys**
