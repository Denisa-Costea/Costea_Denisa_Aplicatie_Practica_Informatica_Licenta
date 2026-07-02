from typing import Annotated, List
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, status

# Importuri din structura plată a backend-ului
from config import get_password_hash
from database import get_db
from models import User, License, PlanType, Content
from schemas import UserRead, LicenseRead, LicenseUpdate, UserAdminUpdate
from auth import get_current_superuser, get_user_by_email

admin_router = APIRouter(prefix="/admin", tags=["admin"])

@admin_router.get("/users", response_model=List[UserRead])
def read_users(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_superuser)],
) -> List[User]:
    statement = select(User).order_by(User.id)
    return db.scalars(statement).all()

@admin_router.put("/licenses/{user_id}", response_model=LicenseRead)
def update_license(
    user_id: int,
    license_in: LicenseUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_superuser)],
) -> License:
    statement = select(License).where(License.user_id == user_id)
    db_license = db.scalar(statement)
    if not db_license:
        db_license = License(user_id=user_id)
        db.add(db_license)
    
    if license_in.plan_type:
        db_license.plan_type = license_in.plan_type
        if license_in.plan_type == PlanType.FREE:
             db_license.credits_remaining = 10
        elif license_in.plan_type == PlanType.PRO:
             db_license.credits_remaining = 100
        elif license_in.plan_type == PlanType.ENTERPRISE:
             db_license.credits_remaining = 1000

    if license_in.credits_remaining is not None:
        db_license.credits_remaining = license_in.credits_remaining
    if license_in.is_active is not None:
        db_license.is_active = license_in.is_active
        
    db.commit()
    db.refresh(db_license)
    return db_license

@admin_router.get("/stats")
def read_stats(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_superuser)],
):
    user_count = db.scalar(select(func.count(User.id)))
    license_counts = db.execute(
        select(License.plan_type, func.count(License.id)).group_by(License.plan_type)
    ).all()
    content_count = db.scalar(select(func.count(Content.id)))
    return {
        "total_users": user_count,
        "total_generations": content_count,
        "license_stats": {plan: count for plan, count in license_counts}
    }

@admin_router.put("/users/{user_id}/status")
def update_user_status(
    user_id: int,
    is_active: bool,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_superuser)],
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilizatorul nu a fost găsit")
    if user.is_superuser:
        raise HTTPException(status_code=400, detail="Nu se poate modifica starea unui administrator")
    user.is_active = is_active
    db.commit()
    return {"message": "Stare utilizator actualizată", "is_active": user.is_active}

@admin_router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_superuser)],
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilizatorul nu a fost găsit")
    if user.is_superuser:
        raise HTTPException(status_code=400, detail="Nu se poate șterge un administrator")
    db.delete(user)
    db.commit()
    return {"message": "Utilizator șters cu succes"}

@admin_router.put("/users/{user_id}", response_model=UserRead)
def update_user_details(
    user_id: int,
    user_in: UserAdminUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_superuser)],
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilizatorul nu a fost găsit")
        
    if user_in.email and user_in.email != user.email:
         existing_user = get_user_by_email(db, user_in.email)
         if existing_user:
             raise HTTPException(status_code=409, detail="Email deja înregistrat")
         user.email = user_in.email
         
    if user_in.password:
        user.hashed_password = get_password_hash(user_in.password)
    if user_in.is_active is not None:
        user.is_active = user_in.is_active
        
    db.commit()
    db.refresh(user)
    return user
