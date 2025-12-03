from fastapi import APIRouter
from app.api.v1.endpoints import auth, disclosures, drafts, comments, files, users

# Create main API router
api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(disclosures.router, prefix="/disclosures", tags=["Disclosures"])
api_router.include_router(drafts.router, prefix="/drafts", tags=["Patent Drafts"])
api_router.include_router(comments.router, prefix="/comments", tags=["Comments"])
api_router.include_router(files.router, prefix="/files", tags=["Files"])
