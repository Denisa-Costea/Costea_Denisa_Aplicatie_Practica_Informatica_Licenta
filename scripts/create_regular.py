import sys
import os

backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'backend')
sys.path.insert(0, os.path.abspath(backend_dir))

from database import SessionLocal
from config import get_password_hash
from models import User, License, PlanType

def create_regular():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "user@cognify.com").first()
        if not user:
            user = User(
                email="user@cognify.com",
                hashed_password=get_password_hash("password123"),
                is_active=True,
                is_superuser=False,
            )
            db.add(user)
            db.flush()

            license = License(
                user_id=user.id,
                plan_type=PlanType.FREE,
                credits_remaining=50,
                is_active=True,
            )
            db.add(license)
            db.commit()
            print("Regular user created: user@cognify.com / password123")
        else:
            print("Regular user already exists: user@cognify.com / password123")
    finally:
        db.close()

if __name__ == "__main__":
    create_regular()
