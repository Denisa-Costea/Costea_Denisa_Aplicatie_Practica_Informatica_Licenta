from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from models import PlanType

# =========================================================================
# 1. SCORES & EVALUATION SCHEMAS (Score)
# =========================================================================
class ScoreBase(BaseModel):
    readability_score: int
    seo_score: int
    sentiment_label: str
    critique: Optional[str] = None
    suggestions: List[str] = []

class ScoreCreate(ScoreBase):
    content_id: int

class ScoreRead(ScoreBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    content_id: int
    created_at: datetime


# =========================================================================
# 2. LICENSES SCHEMAS (License)
# =========================================================================
class LicenseBase(BaseModel):
    plan_type: PlanType = PlanType.FREE
    credits_remaining: int = 10
    is_active: bool = True

class LicenseCreate(LicenseBase):
    user_id: int

class LicenseUpdate(BaseModel):
    plan_type: Optional[PlanType] = None
    credits_remaining: Optional[int] = None
    is_active: Optional[bool] = None
    expires_at: Optional[datetime] = None

class LicenseRead(LicenseBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    expires_at: Optional[datetime]
    created_at: datetime


# =========================================================================
# 3. AI GENERATED CONTENT SCHEMAS (Content)
# =========================================================================
class ContentBase(BaseModel):
    prompt: str
    content_type: str

class ContentCreate(ContentBase):
    pass

class TextGenerateRequest(BaseModel):
    prompt: str
    content_type: str
    platform: str
    tone: str

class ImageGenerateRequest(BaseModel):
    prompt: str
    style: str
    size: str
    platform: str = "LinkedIn"
    model: Optional[str] = "dall-e-3"

class FullPostRequest(BaseModel):
    prompt: str
    content_type: str
    platform: str
    tone: str
    style: str
    size: str
    model: Optional[str] = "dall-e-3"

class ContentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    prompt: str
    generation_type: str
    generated_text: Optional[str] = None
    generated_image_url: Optional[str] = None
    content_type: Optional[str] = None
    platform: Optional[str] = None
    tone: Optional[str] = None
    cost: int
    created_at: datetime
    score: Optional[ScoreRead] = None

class UnifiedHistoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    prompt: str
    generation_type: str # text, image, full, video
    generated_text: Optional[str] = None
    generated_image_url: Optional[str] = None
    video_url: Optional[str] = None
    status: Optional[str] = None
    content_type: Optional[str] = None
    platform: Optional[str] = None
    tone: Optional[str] = None
    cost: int
    created_at: datetime
    score: Optional[ScoreRead] = None


# =========================================================================
# 4. USER SCHEMAS (User)
# =========================================================================
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)

class RegisterRequest(UserCreate):
    pass

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None

class UserAdminUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=8)
    is_active: Optional[bool] = None

class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    is_superuser: bool = False
    created_at: datetime
    license: Optional[LicenseRead] = None
    content_history: List[ContentRead] = []


# =========================================================================
# 5. SECURITY TOKENS SCHEMAS (Token)
# =========================================================================
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    sub: str | None = None


# =========================================================================
# 6. VIDEO GENERATION SCHEMAS (Video)
# =========================================================================
class VideoGenerateRequest(BaseModel):
    prompt: str
    size: str # 720x1280, 1280x720
    seconds: int # 5, 10
    platform: str = "LinkedIn"
    reference_image_url: Optional[str] = None

class VideoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    prompt: str
    video_id: Optional[str] = None
    video_url: Optional[str] = None
    status: str
    size: str
    seconds: int
    platform: Optional[str] = None
    created_at: datetime


# =========================================================================
# 7. SOCIAL MEDIA & PUBLISHING SCHEMAS (Social)
# =========================================================================
class SocialAccountRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    provider: str
    created_at: datetime

class SocialPageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    page_id: str
    page_name: str
    created_at: datetime

class ManualFacebookTokenRequest(BaseModel):
    page_access_token: str
    page_name: str
    page_id: Optional[str] = None

class SocialPostPublishRequest(BaseModel):
    page_id: int
    caption: str
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    content_id: Optional[int] = None

class SocialPostBase(BaseModel):
    platform: str
    caption: str
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    scheduled_at: Optional[datetime] = None

class SocialPostCreate(SocialPostBase):
    content_id: Optional[int] = None

class SocialPostUpdate(BaseModel):
    status: Optional[str] = None
    caption: Optional[str] = None
    scheduled_at: Optional[datetime] = None

class SocialPostRead(SocialPostBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    user_id: int
    page_id: Optional[int] = None
    content_id: Optional[int] = None
    status: str
    provider_post_id: Optional[str] = None
    video_url: Optional[str] = None
    error_message: Optional[str] = None
    published_at: Optional[datetime] = None
    created_at: datetime


# =========================================================================
# 8. UTILITAR SCHEMAS (Common / Utils)
# =========================================================================
class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)
