import sys
import os
from dotenv import load_dotenv

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend'))
sys.path.append(backend_path)
load_dotenv(os.path.join(backend_path, '.env'))

# Override DATABASE_URL to use absolute path
os.environ["DATABASE_URL"] = f"sqlite:///{os.path.join(backend_path, 'sql_app_v2.db')}"

from database import SessionLocal
from config import get_password_hash
from auth import create_user, get_user_by_email
from schemas import RegisterRequest
# Import models to ensure they are registered with SQLAlchemy
from models import User, Content, ContentScore, License

def create_test_user():
    db = SessionLocal()
    email = "admin@cognify.com"
    password = "password123"
    
    try:
        user = get_user_by_email(db, email)
        if user:
            print(f"User {email} already exists. Resetting password...")
            user.hashed_password = get_password_hash(password)
            db.commit()
            print(f"Password for {email} reset to '{password}'.")
        else:
            user_in = RegisterRequest(
                email=email,
                password=password,
                full_name="Admin User"
            )
            user = create_user(db, user_in)
            print(f"User {email} created successfully.")
            
    except Exception as e:
        print(f"Error creating user: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user()
