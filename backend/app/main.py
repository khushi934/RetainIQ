import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.config import settings
from app.core.database import SessionLocal, check_database_connection
from app.core.security import get_password_hash
from app.models.entities import User, Workspace
from app.api.router import api_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("retainiq.app")

def seed_demo_workspace():
    """Ensure default demo account and workspace exist on startup for frictionless evaluation."""
    db: Session = SessionLocal()
    try:
        demo_user = db.scalar(select(User).where(User.email == "demo@retainiq.io"))
        if not demo_user:
            demo_user = User(
                email="demo@retainiq.io",
                hashed_password=get_password_hash("RetainIQ2026!"),
                full_name="Alex Mercer (Lead Analyst)",
                role="admin",
                is_active=True
            )
            db.add(demo_user)
            db.flush()

            demo_ws = Workspace(
                name="Telecom Enterprise Demo",
                slug="telecom-enterprise-demo",
                description="Preloaded portfolio workspace with IBM Telco benchmark dataset and verified models",
                owner_id=demo_user.id,
                is_demo=True
            )
            db.add(demo_ws)
            db.commit()
            logger.info("Created default demo user: demo@retainiq.io and workspace.")
    except Exception as e:
        logger.warning(f"Could not seed demo workspace: {e}")
        db.rollback()
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Verify MySQL & seed
    logger.info("Initializing RetainIQ Backend...")
    db_status = check_database_connection()
    if db_status.get("connected"):
        logger.info(f"MySQL Connected successfully: {db_status.get('mysql_version')}")
        seed_demo_workspace()
    else:
        logger.error(f"MySQL connection warning: {db_status.get('troubleshooting')}")
    yield
    logger.info("RetainIQ Backend shutting down.")

app = FastAPI(
    title="RetainIQ API",
    description="AI-Powered Customer Retention Intelligence Platform. Understand Customers. Prevent Avoidable Churn.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
origins = list(set(settings.CORS_ORIGINS + [settings.FRONTEND_URL]))
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.get("/")
def root():
    return {
        "platform": "RetainIQ",
        "tagline": "Understand Customers. Prevent Avoidable Churn.",
        "status": "online",
        "docs_url": "/docs",
        "api_health": "/api/health"
    }
