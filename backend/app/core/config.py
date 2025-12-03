from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Application
    APP_NAME: str = "Limira"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    DATABASE_URL: str

    # CORS
    FRONTEND_URL: str = "http://localhost:5173"

    # AI Services
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    PRIMARY_LLM_PROVIDER: str = "openai"  # openai, anthropic, or gemini

    # File Storage
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    S3_BUCKET_NAME: Optional[str] = None
    S3_ENDPOINT_URL: Optional[str] = None  # For MinIO/LocalStack

    # File Upload
    MAX_FILE_SIZE_MB: int = 10
    ALLOWED_FILE_EXTENSIONS: str = ".pdf,.png,.jpg,.jpeg,.docx"

    # Video/Transcription
    ENABLE_VIDEO_CHAT: bool = True
    TRANSCRIPTION_SERVICE: str = "whisper"  # whisper or deepgram
    DEEPGRAM_API_KEY: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = True

    @property
    def allowed_extensions_list(self) -> list[str]:
        """Convert comma-separated extensions to list"""
        return [ext.strip() for ext in self.ALLOWED_FILE_EXTENSIONS.split(",")]

    @property
    def max_file_size_bytes(self) -> int:
        """Convert MB to bytes"""
        return self.MAX_FILE_SIZE_MB * 1024 * 1024


# Global settings instance
settings = Settings()
