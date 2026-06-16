from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List
import json


class Settings(BaseSettings):
    # App
    APP_NAME: str = "InsightX AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    API_PREFIX: str = "/api/v1"

    # Security (local JWT)
    SECRET_KEY: str = "insightx-change-this-in-production-use-256bit-key"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    ALGORITHM: str = "HS256"

    # ── Supabase ──────────────────────────────────────────────────────────────
    # Get from: Supabase Dashboard → Project Settings → API → JWT Settings → JWT Secret
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""    # Used to validate Supabase-issued JWTs

    # CORS — comma-separated or JSON array in .env
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:3001,https://*.vercel.app"

    def get_cors_origins(self) -> List[str]:
        raw = (self.ALLOWED_ORIGINS or "").strip()
        if not raw:
            return ["http://localhost:3000"]
        if raw.startswith("["):
            return json.loads(raw)
        return [part.strip() for part in raw.split(",") if part.strip()]

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://insightx:insightx@localhost:5432/insightx"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Storage
    STORAGE_BACKEND: str = "local"  # local | s3 | supabase
    LOCAL_UPLOAD_DIR: str = "./uploads"
    S3_BUCKET: str = ""
    S3_REGION: str = "us-east-1"
    S3_ACCESS_KEY: str = ""
    S3_SECRET_KEY: str = ""
    SUPABASE_STORAGE_BUCKET: str = "evidence-videos"

    # AI Models
    YOLO_MODEL: str = "yolov8s-seg.pt"
    YOLO_POSE_MODEL: str = "yolov8n-pose.pt"
    WHISPER_MODEL: str = "medium"
    USE_FASTER_WHISPER: bool = True
    USE_REASONING: bool = True
    USE_IDENTITY_REID: bool = True
    USE_CADENCE: bool = True
    DEVICE: str = "cpu"  # cpu | cuda

    # ── Detectra AI engine bridge ─────────────────────────────────────────────
    DETECTRA_ENGINE_PATH: str = ""

    # ── Anthropic ─────────────────────────────────────────────────────────────
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL: str = "claude-sonnet-4-6"

    # ── Google Gemini ─────────────────────────────────────────────────────────
    GEMINI_API_KEY: str = ""
    GEMINI_API_KEY_FALLBACK: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash"

    # ── Groq (fast open-source LLM inference) ─────────────────────────────────
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # ── HuggingFace (free open-source models) ─────────────────────────────────
    HUGGINGFACE_API_KEY: str = ""
    HUGGINGFACE_API_KEY_FALLBACK: str = ""
    # Provider fallback order (comma-separated)
    LLM_PROVIDER_ORDER: str = "groq,gemini,huggingface,anthropic"
    # Chat fallback when Anthropic is not available
    HF_CHAT_MODEL: str = "meta-llama/Meta-Llama-3-8B-Instruct"
    # Summarization
    HF_SUMMARIZATION_MODEL: str = "facebook/bart-large-cnn"
    # Scene classification
    HF_SCENE_MODEL: str = "openai/clip-vit-large-patch14"
    # Image captioning (for evidence thumbnails)
    HF_CAPTION_MODEL: str = "Salesforce/blip-image-captioning-large"
    HF_VLM_MODEL: str = "Qwen/Qwen2-VL-2B-Instruct"
    # Zero-shot classification (for anomaly labels)
    HF_CLASSIFY_MODEL: str = "facebook/bart-large-mnli"
    # Whisper ASR via HF (alternative to faster-whisper)
    HF_ASR_MODEL: str = "openai/whisper-large-v3"
    USE_HF_FALLBACK: bool = True

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # Ports
    API_PORT: int = 8000
    FRONTEND_PORT: int = 3000

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    UPLOAD_RATE_LIMIT_PER_MINUTE: int = 10

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
