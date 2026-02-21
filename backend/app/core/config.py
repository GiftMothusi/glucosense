from pydantic_settings import BaseSettings
from typing import List, Optional
from functools import lru_cache


class Settings(BaseSettings):
    # App
    APP_NAME: str = "GlucoSense API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # Security
    SECRET_KEY: str = "change-this-in-production-use-openssl-rand-hex-32"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24        # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/glucosense"
    DATABASE_URL_SYNC: str = "postgresql://postgres:postgres@localhost:5432/glucosense"

    # Redis / Celery
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8081",
        "exp://localhost:8081",
    ]

    # File Storage (AWS S3 or local)
    STORAGE_BACKEND: str = "local"   # "local" | "s3"
    LOCAL_UPLOAD_DIR: str = "uploads"
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_BUCKET_NAME: Optional[str] = None
    AWS_REGION: str = "us-east-1"

    # Sentry
    SENTRY_DSN: Optional[str] = None

    # Analytics
    MIN_READINGS_FOR_PREDICTION: int = 50
    PATTERN_LOOKBACK_DAYS: int = 30
    ANALYTICS_BATCH_SIZE: int = 500

    # Glucose thresholds (mmol/L — also support mg/dL via conversion)
    GLUCOSE_LOW_THRESHOLD: float = 3.9
    GLUCOSE_HIGH_THRESHOLD: float = 10.0
    GLUCOSE_VERY_LOW: float = 3.0
    GLUCOSE_VERY_HIGH: float = 13.9

    # Feature flags
    ENABLE_CGM_SYNC: bool = True
    ENABLE_AI_ASSISTANT: bool = True
    ENABLE_COMMUNITY: bool = False   # Phase 4

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
