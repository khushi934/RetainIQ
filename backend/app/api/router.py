from fastapi import APIRouter
from app.api.endpoints import (
    auth,
    customers,
    datasets,
    analytics,
    models,
    decision_lab,
    investigations,
    campaigns,
    reports,
    assistant
)
from app.core.database import check_database_connection

api_router = APIRouter(prefix="/api")

@api_router.get("/health", tags=["Health"])
def health_check():
    """Verify backend readiness and MySQL server connectivity safely."""
    db_health = check_database_connection()
    return {
        "status": "healthy" if db_health.get("connected") else "degraded",
        "service": "RetainIQ API",
        "version": "1.0.0",
        "database": db_health
    }

api_router.include_router(auth.router)
api_router.include_router(customers.router)
api_router.include_router(datasets.router)
api_router.include_router(analytics.router)
api_router.include_router(models.router)
api_router.include_router(decision_lab.router)
api_router.include_router(investigations.router)
api_router.include_router(campaigns.router)
api_router.include_router(reports.router)
api_router.include_router(assistant.router)
