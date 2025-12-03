from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.api.v1.router import api_router
from app.models.user import User, UserRole
from passlib.context import CryptContext

# Database tables are managed by Alembic migrations
# Run: alembic upgrade head

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered patent disclosure platform for inventors and attorneys",
    version="1.0.0",
    debug=settings.DEBUG,
)

# CORS middleware
allowed_origins = [
    settings.FRONTEND_URL,
    "http://localhost:5173",
    "http://localhost:3000",
]

# Also allow all Vercel preview/production URLs
if settings.ENVIRONMENT == "production":
    allowed_origins.append("https://*.vercel.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in production for Vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


# Startup event to create test users
@app.on_event("startup")
async def create_test_users():
    """Create test users if they don't exist"""
    db = SessionLocal()
    try:
        # Check if test users already exist
        existing_inventor = db.query(User).filter(User.email == 'inventor@test.com').first()
        existing_attorney = db.query(User).filter(User.email == 'attorney@test.com').first()
        
        if not existing_inventor:
            # Create inventor test account
            inventor = User(
                email='inventor@test.com',
                hashed_password=pwd_context.hash('password123'),
                role=UserRole.INVENTOR,
                full_name='John Inventor',
                company='Tech Innovations Inc'
            )
            db.add(inventor)
            print('✅ Created test inventor account: inventor@test.com / password123')
        
        if not existing_attorney:
            # Create attorney test account
            attorney = User(
                email='attorney@test.com',
                hashed_password=pwd_context.hash('password123'),
                role=UserRole.LAWYER,
                full_name='Sarah Attorney',
                company='IP Law Firm'
            )
            db.add(attorney)
            print('✅ Created test attorney account: attorney@test.com / password123')
        
        db.commit()
    except Exception as e:
        print(f'⚠️  Error creating test users: {e}')
        db.rollback()
    finally:
        db.close()



@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Limira API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)
