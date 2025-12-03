from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1.router import api_router

# Database tables are managed by Alembic migrations
# Run: alembic upgrade head

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
