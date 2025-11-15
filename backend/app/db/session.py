"""
Database session management
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

from app.core.config import settings

# Create database engine
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    echo=settings.DEBUG,
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class MockDatabaseSession:
    """Mock database session that raises errors to trigger fallback to mock data"""
    def __init__(self, error: Exception = None):
        self.error = error

    def query(self, *args, **kwargs):
        raise Exception(f"Database unavailable: {self.error if self.error else 'Unknown error'}")

    def close(self):
        pass

    def add(self, *args, **kwargs):
        raise Exception(f"Database unavailable: {self.error if self.error else 'Unknown error'}")

    def commit(self):
        raise Exception(f"Database unavailable: {self.error if self.error else 'Unknown error'}")

    def refresh(self, *args, **kwargs):
        raise Exception(f"Database unavailable: {self.error if self.error else 'Unknown error'}")

    def flush(self):
        raise Exception(f"Database unavailable: {self.error if self.error else 'Unknown error'}")


def get_db() -> Generator[Session, None, None]:
    """
    Dependency to get database session

    Yields:
        Database session or MockDatabaseSession

    Example:
        @app.get("/users")
        def get_users(db: Session = Depends(get_db)):
            return db.query(User).all()
    """
    db = None
    try:
        db = SessionLocal()
    except Exception as e:
        # Database connection failed - return mock session
        print(f"[get_db] Database connection error: {type(e).__name__}: {e}. Falling back to mock data mode.")
        db = MockDatabaseSession(e)
    
    try:
        yield db
    finally:
        if db and hasattr(db, 'close'):
            try:
                db.close()
            except:
                pass
