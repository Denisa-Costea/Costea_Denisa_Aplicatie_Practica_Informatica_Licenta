from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from config import settings

# =========================================================================
# 1. CONEXIUNE BAZĂ DE DATE (Database Session & Engine)
# =========================================================================
# Conectează motorul SQLAlchemy la baza de date SQLite locală
engine = create_engine(
    settings.database_url, 
    connect_args={"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
)

# Fabrica de sesiuni locală pentru baza de date
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependență pentru injectarea sesiunii DB în rute
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Inițializarea bazei de date (crearea tabelelor)
def init_db():
    from models import Base # Import întârziat din models.py pentru a evita importul circular
    Base.metadata.create_all(bind=engine)
