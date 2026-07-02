from functools import lru_cache
from datetime import datetime, timedelta, timezone
from typing import Any
from passlib.context import CryptContext
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from jose import jwt

# =========================================================================
# 1. SETĂRI GLOBALE (Settings)
# =========================================================================
class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Cognify API"
    api_v1_prefix: str = "/api/v1"
    secret_key: str = Field(..., min_length=32)
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    database_url: str = Field(..., description="Database connection URL")
    openai_api_key: str | None = Field(None, description="OpenAI API Key")
    openai_video_model: str = Field("sora-2", description="OpenAI Video Model")
    ai_text_provider: str = Field("openai", description="AI text provider")
    ai_image_provider: str = Field("openai", description="AI image provider")
    
    # Setări Meta / Facebook Developer
    meta_app_id: str | None = Field(None, alias="META_APP_ID")
    meta_app_secret: str | None = Field(None, alias="META_APP_SECRET")
    meta_redirect_uri: str | None = Field(None, alias="META_REDIRECT_URI")
    meta_graph_api_version: str = Field("v20.0", alias="META_GRAPH_API_VERSION")
    app_url: str = Field("http://localhost:8001", alias="APP_URL")

@lru_cache
def get_settings() -> Settings:
    return Settings()

settings = get_settings()

# =========================================================================
# 2. SECURITATE ȘI JWT TOKENS (Security helpers)
# =========================================================================
# Contextul de criptare a parolelor cu algoritmul bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(subject: str | Any, expires_delta: timedelta | None = None) -> str:
    """Creează un token JWT securizat pentru autentificare."""
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )
    payload = {"sub": str(subject), "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifică dacă o parolă simplă corespunde celei criptate din DB."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Generează un hash securizat din parola utilizatorului."""
    return pwd_context.hash(password)
