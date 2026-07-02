"""Seed script to create the default admin user."""
import sys
import os

# Add the backend directory to path
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'backend')
sys.path.insert(0, os.path.abspath(backend_dir))

from database import SessionLocal, init_db
from config import get_password_hash
from models import User, License, PlanType


def create_admin():
    """Create the default admin user if it doesn't exist."""
    init_db()
    db = SessionLocal()
    try:
        # Check if admin already exists
        admin = db.query(User).filter(User.email == "admin@cognify.com").first()
        if admin:
            print("Admin user already exists!")
            return

        # Create admin user
        admin = User(
            email="admin@cognify.com",
            hashed_password=get_password_hash("password123"),
            is_active=True,
            is_superuser=True,
        )
        db.add(admin)
        db.flush()

        # Create admin license
        license = License(
            user_id=admin.id,
            plan_type=PlanType.ENTERPRISE,
            credits_remaining=9999,
            is_active=True,
        )
        db.add(license)
        db.commit()

        print(f"Admin user created successfully!")
        print(f"  Email:    admin@cognify.com")
        print(f"  Password: password123")
        print(f"  Plan:     ENTERPRISE")
    finally:
        db.close()


if __name__ == "__main__":
    create_admin()
