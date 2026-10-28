import logging
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from sqlalchemy.exc import OperationalError, SQLAlchemyError
from app.core.config import settings

logger = logging.getLogger("retainiq.database")

# Ensure no SQLite URL slips through
sync_url = settings.sync_database_url
if "sqlite" in sync_url.lower():
    raise RuntimeError(
        "CRITICAL ARCHITECTURAL VIOLATION: SQLite detected. RetainIQ strictly requires MySQL Server 8.0+."
    )

try:
    engine = create_engine(
        sync_url,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        pool_recycle=3600,
        echo=False
    )
except Exception as e:
    logger.error(f"Failed to create SQLAlchemy engine for MySQL: {e}")
    raise

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    """FastAPI database session dependency."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def check_database_connection() -> dict:
    """
    Safely verify connection to MySQL without exposing credentials.
    Returns status dict with database version and latency indicator.
    """
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT VERSION() AS mysql_version, DATABASE() AS current_db;"))
            row = result.mappings().first()
            return {
                "status": "healthy",
                "database_engine": "MySQL Server",
                "mysql_version": row["mysql_version"] if row else "unknown",
                "database_name": row["current_db"] if row else settings.MYSQL_DATABASE,
                "host": settings.MYSQL_HOST,
                "port": settings.MYSQL_PORT,
                "connected": True
            }
    except OperationalError as oe:
        logger.error(f"MySQL Operational Error: {oe}")
        return {
            "status": "unhealthy",
            "database_engine": "MySQL Server",
            "connected": False,
            "error": "Could not connect to MySQL Server.",
            "troubleshooting": (
                "Ensure MySQL Server 8.0+ is running (e.g. 'Get-Service MySQL80' on Windows). "
                "Verify database 'retainiq_db' exists and user 'retainiq_user' has permissions. "
                "Check connection parameters in .env file."
            )
        }
    except SQLAlchemyError as se:
        logger.error(f"SQLAlchemy Database Error: {se}")
        return {
            "status": "unhealthy",
            "database_engine": "MySQL Server",
            "connected": False,
            "error": "Database query error during connection check.",
            "troubleshooting": "Check schema permissions and MySQL server error logs."
        }
