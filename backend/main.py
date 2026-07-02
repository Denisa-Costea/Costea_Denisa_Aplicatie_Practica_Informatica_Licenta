import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

# Import local database init
from database import init_db
from config import settings

# Import routers from the flat files
from auth import auth_router
from licenses import admin_router
from ai import content_router, ai_router
from social import social_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inițializează baza de date la pornire (crearea tabelelor)
    init_db()
    yield

def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, lifespan=lifespan)
    
    # Setează CORS middleware pentru a permite apelurile de la frontend
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Rutează API-ul prefixat cu prefixul global (ex: /api/v1)
    api_router = APIRouter(prefix=settings.api_v1_prefix)
    api_router.include_router(auth_router)
    api_router.include_router(admin_router)
    api_router.include_router(content_router)
    api_router.include_router(ai_router)
    api_router.include_router(social_router)
    
    app.include_router(api_router)
    
    # Montează folderul static de uploads
    if not os.path.exists("uploads"):
        os.makedirs("uploads")
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
    
    @app.get("/health")
    def health_check():
        return {"status": "ok", "version": "v2.2-flat-reorganized"}
        
    return app

# Instanțierea aplicației globale FastAPI
app = create_app()
