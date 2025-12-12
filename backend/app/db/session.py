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
    import logging
    from sqlalchemy.exc import DBAPIError, OperationalError

    logger = logging.getLogger(__name__)

    print(f"[DEBUG] get_db called. URL: {settings.DATABASE_URL}", flush=True)

    try:
        print("[DEBUG] Creating session...", flush=True)
        db = SessionLocal()
        print("[DEBUG] Session created.", flush=True)
    except (OperationalError, DBAPIError) as e:
        # Catch connection errors during session creation
        logger.error(f"[GET_DB] Session creation failed: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=503,
            detail="Service temporarily unavailable. Database connection failed.",
        )
    except Exception as e:
        # Catch any other unexpected errors
        logger.error(f"[GET_DB] Unexpected error during session creation: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=503,
            detail="Service temporarily unavailable. Database connection failed.",
        )

    try:
        yield db
    except (OperationalError, DBAPIError) as e:
        # Only treat connection errors as database failures
        logger.error(f"[GET_DB] Database error during operation: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=503,
            detail="Service temporarily unavailable. Database connection failed.",
        )
    except Exception as e:
        # Let other exceptions propagate
        logger.error(f"[GET_DB] Exception during db session: {type(e).__name__}: {e}")
        raise
    finally:
        try:
            db.close()
        except Exception as e:
            # Log but silently ignore errors during session cleanup
            logger.warning(f"[GET_DB] Error closing session: {type(e).__name__}: {e}")
