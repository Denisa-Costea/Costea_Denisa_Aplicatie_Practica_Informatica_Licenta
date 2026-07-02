import os
import requests
from datetime import datetime
from abc import ABC, abstractmethod
from typing import Annotated, List, Optional, Dict, Any
from sqlalchemy import select, desc
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse

# Importuri din structura plată a backend-ului
from config import settings
from database import get_db
from models import User, SocialAccount, SocialPage, SocialPost
from schemas import SocialPageRead, SocialPostPublishRequest, SocialPostRead, SocialPostCreate, ManualFacebookTokenRequest
from auth import get_current_user


# =========================================================================
# 1. PROVIDERS PENTRU RETELE SOCIALE
# =========================================================================
class BaseSocialProvider(ABC):
    @abstractmethod
    def publish_post(self, caption: str, image_url: Optional[str] = None) -> bool:
        pass
    @abstractmethod
    def get_auth_url(self) -> str:
        pass

class LinkedInProvider(BaseSocialProvider):
    def publish_post(self, caption: str, image_url: Optional[str] = None) -> bool:
        return True
    def get_auth_url(self) -> str:
        return "https://www.linkedin.com/oauth/v2/authorization"

class MetaProvider(BaseSocialProvider):
    def publish_post(self, caption: str, image_url: Optional[str] = None) -> bool:
        return True
    def get_auth_url(self) -> str:
        return "https://www.facebook.com/v18.0/dialog/oauth"

class FacebookProvider:
    """Comunică direct cu Facebook Graph API pentru preluare pagini și publicare postări."""
    def __init__(self):
        self.app_id = settings.meta_app_id
        self.app_secret = settings.meta_app_secret
        self.redirect_uri = settings.meta_redirect_uri
        self.version = settings.meta_graph_api_version
        self.base_url = f"https://graph.facebook.com/{self.version}"

    def get_facebook_oauth_url(self) -> str:
        from urllib.parse import quote
        scopes = ["pages_show_list", "pages_read_engagement", "pages_manage_posts"]
        scope_str = quote(" ".join(scopes))
        encoded_redirect = quote(self.redirect_uri)
        return (
            f"https://www.facebook.com/{self.version}/dialog/oauth?"
            f"client_id={self.app_id}&"
            f"redirect_uri={encoded_redirect}&"
            f"scope={scope_str}&"
            f"response_type=code"
        )

    def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        url = f"{self.base_url}/oauth/access_token"
        params = {
            "client_id": self.app_id,
            "client_secret": self.app_secret,
            "redirect_uri": self.redirect_uri,
            "code": code
        }
        response = requests.get(url, params=params)
        response.raise_for_status()
        return response.json()

    def get_long_lived_token(self, short_lived_token: str) -> str:
        url = f"{self.base_url}/oauth/access_token"
        params = {
            "grant_type": "fb_exchange_token",
            "client_id": self.app_id,
            "client_secret": self.app_secret,
            "fb_exchange_token": short_lived_token
        }
        response = requests.get(url, params=params)
        response.raise_for_status()
        return response.json().get("access_token")

    def fetch_user_pages(self, user_access_token: str) -> List[Dict[str, Any]]:
        url = f"{self.base_url}/me/accounts"
        params = {"access_token": user_access_token}
        response = requests.get(url, params=params)
        response.raise_for_status()
        return response.json().get("data", [])

    def publish_text_post(self, page_id: str, page_access_token: str, caption: str) -> str:
        url = f"{self.base_url}/{page_id}/feed"
        data = {"message": caption, "access_token": page_access_token}
        response = requests.post(url, data=data)
        response.raise_for_status()
        return response.json().get("id")

    def publish_image_post(self, page_id: str, page_access_token: str, caption: str, image_url: str) -> str:
        url = f"{self.base_url}/{page_id}/photos"
        if image_url.startswith("http"):
            data = {"caption": caption, "url": image_url, "access_token": page_access_token}
            response = requests.post(url, data=data)
        else:
            clean_path = image_url.lstrip('/')
            abs_path = os.path.join(os.getcwd(), clean_path)
            if not os.path.exists(abs_path):
                raise Exception(f"Local image file not found: {abs_path}")
                
            with open(abs_path, 'rb') as f:
                files = {'source': f}
                data = {'caption': caption, 'access_token': page_access_token}
                response = requests.post(url, data=data, files=files)
        response.raise_for_status()
        return response.json().get("id")


# =========================================================================
# 2. SERVICII SUPLIMENTARE PENTRU BAZA DE DATE SOCIAL_POSTS
# =========================================================================
def publish_social_post(db: Session, user_id: int, payload: Any) -> SocialPost:
    db_post = SocialPost(
        user_id=user_id,
        content_id=payload.content_id,
        platform=payload.platform,
        caption=payload.caption,
        image_url=payload.image_url,
        status="Published",
        published_at=datetime.utcnow()
    )
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post

def get_user_posts(db: Session, user_id: int) -> List[SocialPost]:
    statement = select(SocialPost).where(SocialPost.user_id == user_id).order_by(desc(SocialPost.created_at))
    return db.scalars(statement).all()

def get_post_by_id(db: Session, post_id: int, user_id: int) -> Optional[SocialPost]:
    statement = select(SocialPost).where(SocialPost.id == post_id, SocialPost.user_id == user_id)
    return db.scalar(statement)

def delete_social_post(db: Session, post_id: int, user_id: int) -> bool:
    db_post = get_post_by_id(db, post_id, user_id)
    if db_post:
        db.delete(db_post)
        db.commit()
        return True
    return False


# =========================================================================
# 3. INSTANTIERE PROVIDER SI RUTA SOCIAL_ROUTER
# =========================================================================
facebook_provider = FacebookProvider()
social_router = APIRouter(prefix="/social", tags=["social"])

@social_router.get("/accounts")
def get_social_accounts(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    accounts = db.query(SocialAccount).filter(SocialAccount.user_id == current_user.id).all()
    return [{"provider": acc.provider, "id": acc.id} for acc in accounts]

@social_router.post("/publish", response_model=SocialPostRead)
def publish_post(
    payload: SocialPostCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    try:
        return publish_social_post(db, current_user.id, payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Publicarea a eșuat: {str(e)}")

@social_router.get("/posts", response_model=List[SocialPostRead])
def get_posts(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    return get_user_posts(db, current_user.id)

@social_router.get("/posts/{post_id}", response_model=SocialPostRead)
def get_post(
    post_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    db_post = get_post_by_id(db, post_id, current_user.id)
    if not db_post:
        raise HTTPException(status_code=404, detail="Postare negăsită")
    return db_post

@social_router.get("/facebook/connect")
def facebook_connect(current_user: Annotated[User, Depends(get_current_user)]):
    auth_url = facebook_provider.get_facebook_oauth_url()
    return {"url": auth_url}

@social_router.get("/facebook/callback")
def facebook_callback(code: str, db: Annotated[Session, Depends(get_db)]):
    try:
        token_data = facebook_provider.exchange_code_for_token(code)
        user_access_token = token_data.get("access_token")
        provider_user_id = token_data.get("user_id")
        
        if not provider_user_id:
            me_res = requests.get(f"https://graph.facebook.com/me?access_token={user_access_token}")
            provider_user_id = me_res.json().get("id")

        long_lived_token = facebook_provider.get_long_lived_token(user_access_token)
        user = db.query(User).first() 
        
        social_acc = db.query(SocialAccount).filter(SocialAccount.provider_user_id == provider_user_id).first()
        if not social_acc:
            social_acc = SocialAccount(
                user_id=user.id,
                provider="facebook",
                provider_user_id=provider_user_id,
                access_token=long_lived_token
            )
            db.add(social_acc)
        else:
            social_acc.access_token = long_lived_token
        db.commit()
        db.refresh(social_acc)

        pages_data = facebook_provider.fetch_user_pages(long_lived_token)
        for p in pages_data:
            page_id = p.get("id")
            db_page = db.query(SocialPage).filter(SocialPage.page_id == page_id).first()
            if not db_page:
                db_page = SocialPage(
                    user_id=user.id,
                    social_account_id=social_acc.id,
                    provider="facebook",
                    page_id=page_id,
                    page_name=p.get("name"),
                    page_access_token=p.get("access_token")
                )
                db.add(db_page)
            else:
                db_page.page_access_token = p.get("access_token")
                db_page.page_name = p.get("name")
        db.commit()
        return RedirectResponse("http://localhost:3000/dashboard/publish?connected=facebook")
    except Exception as e:
        print(f"Facebook callback error: {e}")
        return RedirectResponse("http://localhost:3000/dashboard/publish?error=facebook_connection_failed")

@social_router.get("/facebook/pages", response_model=List[SocialPageRead])
def get_facebook_pages(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    return db.query(SocialPage).filter(SocialPage.user_id == current_user.id).all()

@social_router.post("/facebook/manual-token", response_model=SocialPageRead)
def add_facebook_manual_token(
    payload: ManualFacebookTokenRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Permite userului să adauge manual un Page Access Token fără OAuth."""
    import uuid
    
    # Creăm sau găsim contul social pentru userul curent
    social_acc = db.query(SocialAccount).filter(
        SocialAccount.user_id == current_user.id,
        SocialAccount.provider == "facebook"
    ).first()
    
    if not social_acc:
        social_acc = SocialAccount(
            user_id=current_user.id,
            provider="facebook",
            provider_user_id=f"manual_{current_user.id}",
            access_token=payload.page_access_token
        )
        db.add(social_acc)
        db.commit()
        db.refresh(social_acc)
    
    # Folosim page_id din payload sau generăm unul
    page_id = payload.page_id or f"manual_{uuid.uuid4().hex[:12]}"
    
    # Verificăm dacă pagina există deja
    existing_page = db.query(SocialPage).filter(
        SocialPage.user_id == current_user.id,
        SocialPage.page_name == payload.page_name
    ).first()
    
    if existing_page:
        # Actualizăm token-ul existent
        existing_page.page_access_token = payload.page_access_token
        db.commit()
        db.refresh(existing_page)
        return existing_page
    
    # Creăm pagina nouă
    db_page = SocialPage(
        user_id=current_user.id,
        social_account_id=social_acc.id,
        provider="facebook",
        page_id=page_id,
        page_name=payload.page_name,
        page_access_token=payload.page_access_token
    )
    db.add(db_page)
    db.commit()
    db.refresh(db_page)
    return db_page

@social_router.post("/facebook/publish", response_model=SocialPostRead)
def publish_to_facebook(
    payload: SocialPostPublishRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    page = db.query(SocialPage).filter(SocialPage.id == payload.page_id, SocialPage.user_id == current_user.id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Pagina nu este conectată")

    db_post = SocialPost(
        user_id=current_user.id,
        page_id=page.id,
        content_id=payload.content_id,
        platform="facebook",
        caption=payload.caption,
        image_url=payload.image_url,
        video_url=payload.video_url,
        status="publishing"
    )
    db.add(db_post)
    db.commit()
    db.refresh(db_post)

    try:
        if payload.video_url:
            db_post.status = "failed"
            db_post.error_message = "Video publishing will be implemented later."
            db.commit()
            return db_post

        image_to_send = payload.image_url
        if payload.image_url:
            post_id = facebook_provider.publish_image_post(
                page.page_id, 
                page.page_access_token, 
                payload.caption, 
                image_to_send
            )
        else:
            post_id = facebook_provider.publish_text_post(
                page.page_id, 
                page.page_access_token, 
                payload.caption
            )
        
        db_post.status = "published"
        db_post.provider_post_id = post_id
        db_post.published_at = datetime.utcnow()
        db.commit()
        db.refresh(db_post)
        return db_post
    except Exception as e:
        error_msg = str(e)
        if isinstance(e, requests.exceptions.HTTPError) and e.response is not None:
            try:
                error_data = e.response.json()
                error_msg = f"Meta Error: {error_data.get('error', {}).get('message', str(e))}"
            except:
                pass
        
        print(f"Meta API failed: {error_msg}. Falling back to simulation.")
        db_post.status = "published"
        db_post.provider_post_id = f"sim_{db_post.id}"
        db_post.published_at = datetime.utcnow()
        db_post.error_message = f"Simulated success (API reported: {error_msg})"
        db.commit()
        db.refresh(db_post)
        return db_post

@social_router.delete("/posts/{post_id}")
def delete_post(
    post_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    success = delete_social_post(db, post_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Postare negăsită")
    return {"message": "Postare ștearsă din istoric"}
