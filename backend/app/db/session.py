"""
Database session management
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
from fastapi import HTTPException

from app.core.config import settings

# Create database engine
connect_args = {}
engine_args = {
    "pool_pre_ping": True,
    "echo": settings.DEBUG,
}

if "sqlite" in settings.DATABASE_URL:
    connect_args["check_same_thread"] = False
    engine_args["connect_args"] = connect_args
else:
    engine_args["pool_size"] = 10
    engine_args["max_overflow"] = 20

engine = create_engine(
    settings.DATABASE_URL,
    **engine_args
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    Dependency to get database session.

    Yields a SQLAlchemy session or raises HTTPException if database is unavailable.

    Raises:
        HTTPException: 503 Service Unavailable if database connection fails

    Example:
        @app.get("/users")
        def get_users(db: Session = Depends(get_db)):
            return db.query(User).all()
    """
    from sqlalchemy.exc import DBAPIError, OperationalError

    db = None
    try:
        print("DEBUG: Creating DB session", flush=True)
        db = SessionLocal()
        print("DEBUG: DB session created", flush=True)
        yield db
    except (OperationalError, DBAPIError) as e:
        # Only treat connection errors as database failures
        error_msg = f"Database unavailable: {type(e).__name__}"
        raise HTTPException(
            status_code=503,
            detail="Service temporarily unavailable. Database connection failed.",
        )
    finally:
        if db is not None:
            try:
                db.close()
            except Exception:
                # Silently ignore errors during session cleanup
                pass
