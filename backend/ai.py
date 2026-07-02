import os
import uuid
import base64
import requests
import json
import time
import datetime
from typing import Annotated, List, Optional, Dict, Any
from sqlalchemy import select, desc, func
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, status
from openai import OpenAI

# Importuri din structura plată a backend-ului
from config import settings
from database import get_db
from models import User, License, PlanType, Content, ContentScore, VideoGeneration
from schemas import (
    ContentRead, TextGenerateRequest, ImageGenerateRequest, FullPostRequest, UnifiedHistoryRead,
    VideoGenerateRequest, VideoRead
)
from auth import get_current_user

# =========================================================================
# 1. SALVARE IMAGINI LOCAL (Image helper utilities)
# =========================================================================
def save_image_locally(url: str, subfolder: str = "generated") -> Optional[str]:
    """Descarcă o imagine de la un URL (ex: DALL-E) și o salvează local pe server."""
    try:
        upload_dir = os.path.join("uploads", subfolder)
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)

        filename = f"{uuid.uuid4()}.png"
        filepath = os.path.join(upload_dir, filename)

        response = requests.get(url, timeout=30)
        response.raise_for_status()

        with open(filepath, "wb") as f:
            f.write(response.content)

        return f"/uploads/{subfolder}/{filename}"
    except Exception as e:
        print(f"Error saving image locally: {e}")
        return None

def save_b64_image_locally(b64_data: str, subfolder: str = "generated") -> Optional[str]:
    """Salvează o imagine codificată în Base64 local pe server."""
    try:
        upload_dir = os.path.join("uploads", subfolder)
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)

        filename = f"{uuid.uuid4()}.png"
        filepath = os.path.join(upload_dir, filename)

        with open(filepath, "wb") as f:
            f.write(base64.b64decode(b64_data))

        return f"/uploads/{subfolder}/{filename}"
    except Exception as e:
        print(f"Error saving b64 image locally: {e}")
        return None


# =========================================================================
# 2. INTEGRARE SERVICII AI - OPENAI (AI services)
# =========================================================================
client = None
if settings.openai_api_key:
    client = OpenAI(api_key=settings.openai_api_key)

def generate_marketing_content(prompt: str, content_type: str) -> str:
    """Funcție alias apelată de rutele vechi pentru generarea de text."""
    return generate_text_content(prompt, content_type, "none", "professional")

def generate_text_content(prompt: str, content_type: str, platform: str, tone: str) -> str:
    """Generează text folosind gpt-4o-mini cu simulare pe post de fallback."""
    if not client:
        # Simulare text pe post de fallback în cazul lipsei cheii API
        hashtags = " ".join([f"#{word.lower()}" for word in prompt.replace(',', '').split()[:3] if len(word) > 3])
        return (
            f"🚀 **Inovație & Performanță** 🚀\n\n"
            f"Suntem încântați să vă prezentăm noi perspective bazate pe ideea: *{prompt}*.\n\n"
            f"Într-o eră a vitezei și a tehnologiei, succesul aparține celor care știu să combine datele cu intuiția. "
            f"Această analiză ne arată importanța adaptării continue și a inovației în marketingul modern.\n\n"
            f"💡 Ce părere aveți despre această abordare?\n\n"
            f"{hashtags} #Cognify #AI #Innovation #Marketing"
        )

    system_prompt = f"You are an expert copywriter specializing in {content_type} for {platform}. Write in a {tone} tone."
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=500
        )
        return response.choices[0].message.content or ""
    except Exception as e:
        print(f"OpenAI API Error: {e}. Falling back to simulation.")
        hashtags = " ".join([f"#{word.lower()}" for word in prompt.replace(',', '').split()[:3] if len(word) > 3])
        return (
            f"🚀 **Inovație & Performanță** 🚀\n\n"
            f"Suntem încântați să vă prezentăm noi perspective bazate pe ideea: *{prompt}*.\n\n"
            f"Într-o eră a vitezei și a tehnologiei, succesul aparține celor care știu să combine datele cu intuiția.\n\n"
            f"{hashtags} #Cognify #AI"
        )

def generate_image_content(prompt: str, style: str, size: str, model: str = "dall-e-3") -> str:
    """Generează o imagine folosind OpenAI DALL-E, descărcând-o local. Include imagini Unsplash pe post de fallback."""
    fallback_images = [
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1024&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1024&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1024&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1024&q=80&auto=format&fit=crop"
    ]
    fallback_image = fallback_images[len(prompt) % len(fallback_images)]

    if not client:
        return fallback_image

    try:
        try:
            response = client.images.generate(
                model=model,
                prompt=f"{prompt}. Style: {style}",
                size="1024x1024",
                quality="standard",
                n=1,
            )
        except Exception as e:
            if "does not exist" in str(e).lower() and model == "dall-e-3":
                print("DALL-E 3 not found, falling back to dall-e-2")
                response = client.images.generate(
                    model="dall-e-2",
                    prompt=f"{prompt}. Style: {style}",
                    size="1024x1024",
                    n=1,
                )
            else:
                raise e

        if response.data[0].url:
            local_path = save_image_locally(response.data[0].url)
            return local_path if local_path else response.data[0].url
        elif response.data[0].b64_json:
            return save_b64_image_locally(response.data[0].b64_json)
        return fallback_image
    except Exception as e:
        print(f"OpenAI Image Error: {e}. Falling back to simulation.")
        return fallback_image

def analyze_content_score(text: str) -> dict:
    """Evaluează textul folosind modul structurat JSON din GPT."""
    mock_analysis = {
        "readability_score": 85,
        "seo_score": 90,
        "sentiment_label": "Positive",
        "critique": "Textul este excelent structurat, având un ton profesional și o dinamică excelentă.",
        "suggestions": [
            "Adăugați un îndemn la acțiune (CTA) clar la finalul postării.",
            "Includeți 1-2 hashtag-uri suplimentare specifice nișei dvs."
        ]
    }

    if not client:
        return mock_analysis

    system_prompt = """
    You are an expert content analyst. Analyze the provided text and return a JSON object with the following fields:
    - readability_score (0-100 integer)
    - seo_score (0-100 integer)
    - sentiment_label (Positive, Neutral, or Negative)
    - critique (A short 1-sentence summary of quality)
    - suggestions (A list of 2-3 specific improvements)
    
    Ensure the output is valid JSON.
    """
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text}
            ],
            temperature=0.5,
            max_tokens=200,
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"OpenAI Analysis Error: {e}. Falling back to simulation.")
        return mock_analysis

def generate_video_content(prompt: str, size: str, seconds: int) -> dict:
    """Trimite solicitare de generare video (Sora-2)."""
    try:
        api_seconds = str(seconds) if seconds in [4, 8, 12] else "8"
        video_job = client.videos.create(
            model="sora-2",
            prompt=prompt,
            size=size,
            seconds=api_seconds
        )
        return {
            "id": video_job.id,
            "status": video_job.status,
            "video_url": getattr(video_job, 'video_url', None)
        }
    except Exception as e:
        print(f"OpenAI Video API Error: {e}")
        return {
            "id": f"sim_{int(time.time())}_{prompt[:10].replace(' ', '_')}",
            "status": "queued"
        }

def get_video_generation_status(video_id: str, prompt: str = "") -> dict:
    """Verifică starea unui videoclip în curs de generare, descarcându-l în folderul public la final."""
    if video_id.startswith("sim_"):
        if prompt:
            image_url = generate_image_content(
                prompt=f"Cinematic realistic high-detail video keyframe: {prompt}",
                style="realistic",
                size="landscape"
            )
            return {"id": video_id, "status": "completed", "video_url": image_url}
        return {"id": video_id, "status": "completed", "video_url": "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4"}

    try:
        video_job = client.videos.retrieve(video_id)
        video_url = None
        if video_job.status == "completed":
            try:
                video_filename = f"{video_id}.mp4"
                public_path = r"c:\Users\User\Cognify\frontend\public\videos"
                if not os.path.exists(public_path):
                    os.makedirs(public_path)
                file_path = os.path.join(public_path, video_filename)
                
                if not os.path.exists(file_path):
                    content = client.videos.download_content(video_id)
                    with open(file_path, "wb") as f:
                        f.write(content.content)
                video_url = f"/videos/{video_filename}"
            except Exception as download_err:
                print(f"Error downloading video content: {download_err}")
                if hasattr(video_job, 'video_url') and video_job.video_url:
                    video_url = video_job.video_url
            
        return {
            "id": video_id,
            "status": video_job.status,
            "video_url": video_url
        }
    except Exception as e:
        print(f"OpenAI Video Status Error: {e}")
        return {"status": "failed"}


# =========================================================================
# 3. HELPER VERIFICARE CREDITE
# =========================================================================
def check_credits(user: User, cost: int = 1):
    if not user.license:
        raise HTTPException(status_code=403, detail="Licență inactivă.")
    if user.license.credits_remaining < cost:
        raise HTTPException(status_code=403, detail="Credite insuficiente. Actualizați abonamentul.")


# =========================================================================
# 4. RUTERELE DE API PENTRU CONȚINUT ȘI AI (Content & AI Routers)
# =========================================================================
content_router = APIRouter(prefix="/content", tags=["content"])
ai_router = APIRouter(prefix="/ai", tags=["ai"])

# ----------------- content_router endpoints -----------------
@content_router.post("/generate", response_model=ContentRead)
def generate_content_route(
    payload: TextGenerateRequest,  # Folosește schema TextGenerateRequest pentru generarea textului simplu
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Content:
    check_credits(current_user, 1)
    
    generated_text = generate_marketing_content(payload.prompt, payload.content_type)
    
    cost = 1
    current_user.license.credits_remaining -= cost
    
    db_content = Content(
        user_id=current_user.id,
        prompt=payload.prompt,
        content_type=payload.content_type,
        generated_text=generated_text,
        cost=cost
    )
    db.add(db_content)
    db.add(current_user.license)
    db.commit()
    db.refresh(db_content)
    return db_content

@content_router.get("/history", response_model=List[ContentRead])
def get_content_history(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> List[Content]:
    statement = select(Content).where(Content.user_id == current_user.id).order_by(desc(Content.created_at))
    return db.scalars(statement).all()

@content_router.post("/{content_id}/analyze", response_model=ContentRead)
def analyze_content(
    content_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    content = db.get(Content, content_id)
    if not content:
        raise HTTPException(status_code=404, detail="Conținut negăsit")
    if content.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Neautorizat")
    if content.score:
        return content

    analysis_result = analyze_content_score(content.generated_text)
    
    score = ContentScore(
        content_id=content.id,
        readability_score=analysis_result.get("readability_score", 0),
        seo_score=analysis_result.get("seo_score", 0),
        sentiment_label=analysis_result.get("sentiment_label", "Neutral"),
        critique=analysis_result.get("critique", ""),
        suggestions=analysis_result.get("suggestions", [])
    )
    db.add(score)
    db.commit()
    db.refresh(content)
    return content

@content_router.delete("/{content_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_content(
    content_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    content = db.get(Content, content_id)
    if not content:
        raise HTTPException(status_code=404, detail="Conținut negăsit")
    if content.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Neautorizat")
    db.delete(content)
    db.commit()
    return None

# ----------------- ai_router endpoints -----------------
@ai_router.post("/generate-text", response_model=ContentRead)
def generate_text(
    payload: TextGenerateRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    cost = 1
    check_credits(current_user, cost)
    generated_text = generate_text_content(
        prompt=payload.prompt, 
        content_type=payload.content_type, 
        platform=payload.platform, 
        tone=payload.tone
    )
    current_user.license.credits_remaining -= cost
    db_content = Content(
        user_id=current_user.id,
        prompt=payload.prompt,
        generation_type="text",
        generated_text=generated_text,
        generated_image_url="",
        content_type=payload.content_type,
        platform=payload.platform,
        tone=payload.tone,
        cost=cost
    )
    db.add(db_content)
    db.add(current_user.license)
    db.commit()
    db.refresh(db_content)
    return db_content

@ai_router.post("/generate-image", response_model=ContentRead)
def generate_image(
    payload: ImageGenerateRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    cost = 5
    check_credits(current_user, cost)
    image_url = generate_image_content(
        prompt=payload.prompt, 
        style=payload.style, 
        size=payload.size,
        model=payload.model
    )
    current_user.license.credits_remaining -= cost
    db_content = Content(
        user_id=current_user.id,
        prompt=payload.prompt,
        generation_type="image",
        generated_text="",
        generated_image_url=image_url,
        content_type="",
        platform=payload.platform,
        tone="",
        cost=cost
    )
    db.add(db_content)
    db.add(current_user.license)
    db.commit()
    db.refresh(db_content)
    return db_content

@ai_router.post("/generate-full-post", response_model=ContentRead)
def generate_full_post(
    payload: FullPostRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    cost = 6
    check_credits(current_user, cost)
    generated_text = generate_text_content(
        prompt=payload.prompt, 
        content_type=payload.content_type, 
        platform=payload.platform, 
        tone=payload.tone
    )
    image_url = generate_image_content(
        prompt=payload.prompt, 
        style=payload.style, 
        size=payload.size,
        model=payload.model
    )
    current_user.license.credits_remaining -= cost
    db_content = Content(
        user_id=current_user.id,
        prompt=payload.prompt,
        generation_type="full",
        generated_text=generated_text,
        generated_image_url=image_url,
        content_type=payload.content_type,
        platform=payload.platform,
        tone=payload.tone,
        cost=cost
    )
    db.add(db_content)
    db.add(current_user.license)
    db.commit()
    db.refresh(db_content)
    return db_content

@ai_router.get("/history", response_model=List[UnifiedHistoryRead])
def get_ai_history(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    contents = db.scalars(select(Content).where(Content.user_id == current_user.id)).all()
    videos = db.scalars(select(VideoGeneration).where(VideoGeneration.user_id == current_user.id)).all()
    unified_history = []
    
    for c in contents:
        unified_history.append({
            "id": c.id,
            "prompt": c.prompt,
            "generation_type": c.generation_type,
            "generated_text": c.generated_text,
            "generated_image_url": c.generated_image_url,
            "video_url": None,
            "status": "completed",
            "content_type": c.content_type,
            "platform": c.platform,
            "tone": c.tone,
            "cost": c.cost,
            "created_at": c.created_at,
            "score": c.score
        })
    for v in videos:
        unified_history.append({
            "id": v.id,
            "prompt": v.prompt,
            "generation_type": "video",
            "generated_text": None,
            "generated_image_url": None,
            "video_url": v.video_url,
            "status": v.status,
            "content_type": "Video",
            "platform": v.platform,
            "tone": None,
            "cost": 50,
            "created_at": v.created_at
        })
    unified_history.sort(key=lambda x: x["created_at"], reverse=True)
    return unified_history

@ai_router.get("/preview/{content_id}", response_model=UnifiedHistoryRead)
def get_single_history(
    content_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    type: str = "image"
):
    if type == "video":
        v = db.get(VideoGeneration, content_id)
        if not v or v.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Video negăsit")
        return {
            "id": v.id,
            "prompt": v.prompt,
            "generation_type": "video",
            "generated_text": None,
            "generated_image_url": None,
            "video_url": v.video_url,
            "status": v.status,
            "content_type": "Video",
            "platform": v.platform,
            "tone": None,
            "cost": 50,
            "created_at": v.created_at
        }
    else:
        c = db.get(Content, content_id)
        if not c or c.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Conținut negăsit")
        return {
            "id": c.id,
            "prompt": c.prompt,
            "generation_type": c.generation_type,
            "generated_text": c.generated_text,
            "generated_image_url": c.generated_image_url,
            "video_url": None,
            "status": "completed",
            "content_type": c.content_type,
            "platform": c.platform,
            "tone": c.tone,
            "cost": c.cost,
            "created_at": c.created_at,
            "score": c.score
        }

@ai_router.post("/video-generate", response_model=VideoRead)
def generate_video(
    payload: VideoGenerateRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    cost = 50
    check_credits(current_user, cost)
    video_job = generate_video_content(
        prompt=payload.prompt,
        size=payload.size,
        seconds=payload.seconds
    )
    current_user.license.credits_remaining -= cost
    db_video = VideoGeneration(
        user_id=current_user.id,
        prompt=payload.prompt,
        video_id=video_job.get("id"),
        video_url=video_job.get("video_url"),
        status=video_job.get("status", "queued"),
        size=payload.size,
        seconds=payload.seconds,
        platform=payload.platform
    )
    db.add(db_video)
    db.add(current_user.license)
    db.commit()
    db.refresh(db_video)
    return db_video

@ai_router.get("/video-status/{video_id}", response_model=VideoRead)
def get_video_status(
    video_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    statement = select(VideoGeneration).where(
        VideoGeneration.id == video_id, 
        VideoGeneration.user_id == current_user.id
    )
    db_video = db.scalar(statement)
    if not db_video:
        raise HTTPException(status_code=404, detail="Video negăsit")
        
    if db_video.status not in ["completed", "failed"] and db_video.video_id:
        now = datetime.datetime.now(datetime.timezone.utc)
        created_at = db_video.created_at
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=datetime.timezone.utc)
        time_passed = (now - created_at).total_seconds()
        
        if db_video.video_id.startswith("sim_"):
            if time_passed < 15:
                db_video.status = "in_progress"
            else:
                video_job = get_video_generation_status(db_video.video_id, prompt=db_video.prompt)
                db_video.status = "completed"
                db_video.video_url = video_job.get("video_url")
            db.commit()
            db.refresh(db_video)
        else:
            video_job = get_video_generation_status(db_video.video_id)
            if video_job.get("status"):
                db_video.status = video_job["status"]
                if video_job["status"] == "processing":
                    db_video.status = "in_progress"
                if video_job.get("video_url"):
                    db_video.video_url = video_job["video_url"]
                db.commit()
                db.refresh(db_video)
    return db_video

@ai_router.delete("/video/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_video_generation(
    video_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    v = db.get(VideoGeneration, video_id)
    if not v:
        raise HTTPException(status_code=404, detail="Video negăsit")
    if v.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Neautorizat")
    db.delete(v)
    db.commit()
    return None
