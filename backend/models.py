from datetime import datetime
from enum import Enum
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Enum as SQLAREnum, Text, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship, declarative_base

# Declararea clasei de bază pentru SQLAlchemy
Base = declarative_base()

# Tipul de plan tarifar pentru licență
class PlanType(str, Enum):
    FREE = "FREE"
    PRO = "PRO"
    ENTERPRISE = "ENTERPRISE"


# =========================================================================
# 1. TABELUL UTILIZATORILOR (users)
# =========================================================================
class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relații
    license: Mapped["License"] = relationship("License", back_populates="user", uselist=False, cascade="all, delete-orphan")
    content_history: Mapped[list["Content"]] = relationship("Content", back_populates="user", cascade="all, delete-orphan")
    social_posts: Mapped[list["SocialPost"]] = relationship("SocialPost", back_populates="user", cascade="all, delete-orphan")
    social_accounts: Mapped[list["SocialAccount"]] = relationship("SocialAccount", back_populates="user", cascade="all, delete-orphan")
    social_pages: Mapped[list["SocialPage"]] = relationship("SocialPage", back_populates="user", cascade="all, delete-orphan")
    video_generations: Mapped[list["VideoGeneration"]] = relationship("VideoGeneration", back_populates="user", cascade="all, delete-orphan")


# =========================================================================
# 2. TABELUL LICENȚELOR ȘI CREDITE (licenses)
# =========================================================================
class License(Base):
    __tablename__ = "licenses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    plan_type: Mapped[PlanType] = mapped_column(SQLAREnum(PlanType), default=PlanType.FREE, nullable=False)
    credits_remaining: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relație cu utilizatorul
    user = relationship("User", back_populates="license")


# =========================================================================
# 3. TABELUL CONȚINUTULUI GENERAT DE AI (content)
# =========================================================================
class Content(Base):
    __tablename__ = "content"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    prompt: Mapped[str] = mapped_column(String, nullable=False)
    generated_text: Mapped[str] = mapped_column(String, nullable=True)
    generated_image_url: Mapped[str] = mapped_column(String, nullable=True)
    generation_type: Mapped[str] = mapped_column(String, default="text") # text, image, full (text + imagine)
    content_type: Mapped[str] = mapped_column(String, nullable=True)  # email, blog, post etc.
    platform: Mapped[str] = mapped_column(String, nullable=True)
    tone: Mapped[str] = mapped_column(String, nullable=True)
    cost: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relații
    user: Mapped["User"] = relationship("User", back_populates="content_history")
    score: Mapped["ContentScore"] = relationship("ContentScore", back_populates="content", uselist=False, cascade="all, delete-orphan")


# =========================================================================
# 4. TABELUL SCORURILOR ȘI ANALIZEI AI (content_scores)
# =========================================================================
class ContentScore(Base):
    __tablename__ = "content_scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    content_id: Mapped[int] = mapped_column(Integer, ForeignKey("content.id"), unique=True, nullable=False)
    
    # Metricile de performanță
    readability_score: Mapped[int] = mapped_column(Integer, nullable=False) # 0-100
    seo_score: Mapped[int] = mapped_column(Integer, nullable=False) # 0-100
    sentiment_label: Mapped[str] = mapped_column(String, nullable=False) # Positive, Neutral, Negative
    
    # Detaliile analizei
    critique: Mapped[str] = mapped_column(String, nullable=True)
    suggestions: Mapped[list[str]] = mapped_column(JSON, default=list)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relație cu conținutul asociat
    content = relationship("Content", back_populates="score")


# =========================================================================
# 5. TABELUL MONITORIZĂRII GENERĂRILOR VIDEO (video_generations)
# =========================================================================
class VideoGeneration(Base):
    __tablename__ = "video_generations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    prompt: Mapped[str] = mapped_column(String, nullable=False)
    video_id: Mapped[str] = mapped_column(String, nullable=True, index=True)
    video_url: Mapped[str] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="queued") # queued, in_progress, completed, failed
    size: Mapped[str] = mapped_column(String, nullable=False)
    seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    platform: Mapped[str] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relație
    user: Mapped["User"] = relationship("User", back_populates="video_generations")


# =========================================================================
# 6. TABELUL CONTURILOR SOCIALE CONECTATE (social_accounts)
# =========================================================================
class SocialAccount(Base):
    __tablename__ = "social_accounts"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    provider: Mapped[str] = mapped_column(String, default="facebook")
    provider_user_id: Mapped[str] = mapped_column(String)
    access_token: Mapped[str] = mapped_column(String)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relații
    user = relationship("User", back_populates="social_accounts")
    pages = relationship("SocialPage", back_populates="social_account", cascade="all, delete-orphan")


# =========================================================================
# 7. TABELUL PAGINILOR DE SOCIAL MEDIA GESTIONATE (social_pages)
# =========================================================================
class SocialPage(Base):
    __tablename__ = "social_pages"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    social_account_id: Mapped[int] = mapped_column(ForeignKey("social_accounts.id"))
    provider: Mapped[str] = mapped_column(String, default="facebook")
    page_id: Mapped[str] = mapped_column(String)
    page_name: Mapped[str] = mapped_column(String)
    page_access_token: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relații
    user = relationship("User", back_populates="social_pages")
    social_account = relationship("SocialAccount", back_populates="pages")
    posts = relationship("SocialPost", back_populates="page")


# =========================================================================
# 8. TABELUL POSTĂRILOR PUBLICATE PRIN META/FACEBOOK (social_posts)
# =========================================================================
class SocialPost(Base):
    __tablename__ = "social_posts"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    page_id: Mapped[Optional[int]] = mapped_column(ForeignKey("social_pages.id"), nullable=True)
    content_id: Mapped[Optional[int]] = mapped_column(ForeignKey("content.id"), nullable=True)
    
    platform: Mapped[str] = mapped_column(String) # Facebook, Instagram, LinkedIn etc.
    caption: Mapped[str] = mapped_column(Text)
    image_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    video_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    status: Mapped[str] = mapped_column(String, default="draft") # draft, published, failed
    provider_post_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relații
    user = relationship("User", back_populates="social_posts")
    page = relationship("SocialPage", back_populates="posts")
    content = relationship("Content")
