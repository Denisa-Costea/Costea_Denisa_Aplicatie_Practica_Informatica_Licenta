from datetime import timedelta
from typing import Annotated, Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy import select
from sqlalchemy.orm import Session

# Importuri din structura plată a backend-ului
from config import settings, verify_password, get_password_hash, create_access_token
from database import get_db
from models import User, License, PlanType
from schemas import UserRead, RegisterRequest, LoginRequest, UserUpdate, ChangePasswordRequest

# =========================================================================
# 1. DEPENDENȚE DE FILTRARE UTILIZATORI (FastAPI Auth Dependencies)
# =========================================================================
# Schema OAuth2 pentru extragerea token-ului din antet (Authorization Bearer Header)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.api_v1_prefix}/auth/login")

def get_current_user(
    db: Annotated[Session, Depends(get_db)],
    token: Annotated[str, Depends(oauth2_scheme)],
) -> User:
    """Validează token-ul JWT primit și returnează utilizatorul logat curent."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token-ul de autentificare este invalid sau expirat",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Decodează token-ul cu cheia secretă globală
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        subject = payload.get("sub")
        if subject is None:
            raise credentials_exception
        user_id = int(subject)
    except (JWTError, ValueError):
        raise credentials_exception

    user = get_user_by_id(db, user_id=user_id)
    if not user or not user.is_active:
        raise credentials_exception
    return user

def get_current_superuser(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Verifică dacă utilizatorul curent are privilegii de admin."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Permisiuni insuficiente pentru această acțiune"
        )
    return current_user


# =========================================================================
# 2. FUNCȚII CRUD PENTRU UTILIZATORI ȘI AUTENTIFICARE
# =========================================================================
def get_user_by_email(db: Session, email: str) -> User | None:
    statement = select(User).where(User.email == email)
    return db.scalar(statement)

def get_user_by_id(db: Session, user_id: int) -> User | None:
    statement = select(User).where(User.id == user_id)
    return db.scalar(statement)

def create_user(db: Session, user_in: Any) -> User:
    """Creează un utilizator nou în baza de date și îi atașează automat o licență FREE."""
    db_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        is_active=True,
    )
    db.add(db_user)
    db.flush()

    db_license = License(
        user_id=db_user.id,
        plan_type=PlanType.FREE,
        credits_remaining=10,
        is_active=True,
    )
    db.add(db_license)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_password(db: Session, user: User, new_password: str) -> User:
    user.hashed_password = get_password_hash(new_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def update_user(db: Session, user: User, user_in: dict) -> User:
    for field, value in user_in.items():
        if value is not None:
            setattr(user, field, value)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def authenticate_user(db: Session, email: str, password: str) -> User | None:
    """Validează credențialele de email și parolă pentru login."""
    user = get_user_by_email(db, email=email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


# =========================================================================
# 3. RUTERELE DE API PENTRU AUTENTIFICARE
# =========================================================================
auth_router = APIRouter(prefix="/auth", tags=["auth"])

@auth_router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Annotated[Session, Depends(get_db)]) -> User:
    existing_user = get_user_by_email(db, email=payload.email)
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Adresa de email este deja înregistrată")
    return create_user(db, payload)

@auth_router.post("/login")
def login(payload: LoginRequest, db: Annotated[Session, Depends(get_db)]):
    user = authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email sau parolă incorectă")
    access_token = create_access_token(
        subject=user.id,
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "is_superuser": user.is_superuser,
    }

@auth_router.get("/me", response_model=UserRead)
def read_current_user(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    return current_user

@auth_router.post("/change-password", status_code=status.HTTP_200_OK)
def change_password_route(
    payload: ChangePasswordRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Any:
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Parola curentă este incorectă")
    update_password(db, current_user, payload.new_password)
    return {"message": "Parola a fost actualizată cu succes"}

@auth_router.put("/me", response_model=UserRead)
def update_user_me(
    payload: UserUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    if payload.email and payload.email != current_user.email:
        existing_user = get_user_by_email(db, email=payload.email)
        if existing_user:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Adresa de email este deja folosită")
    return update_user(db, current_user, payload.model_dump(exclude_unset=True))
