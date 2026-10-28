from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.entities import Workspace
from app.schemas.analytics import (
    OverviewMetrics, ChurnByContract, ChurnByInternet, ChurnByTenureCohort,
    ChurnTrendPoint, RiskTierDistribution, SegmentPerformance
)
from app.services.analytics.sql_analytics import SQLAnalyticsService
from app.api.deps import get_current_workspace

router = APIRouter(prefix="/analytics", tags=["SQL Analytics"])

@router.get("/overview", response_model=OverviewMetrics)
def get_overview_kpis(
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    """Retrieve verified overview KPIs computed directly in MySQL."""
    service = SQLAnalyticsService(db)
    return service.get_overview_metrics(workspace.id)

@router.get("/contracts", response_model=List[ChurnByContract])
def get_churn_by_contracts(
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    """Retrieve contract type breakdown with observed churn rates and MRR."""
    service = SQLAnalyticsService(db)
    return service.get_churn_by_contract(workspace.id)

@router.get("/internet", response_model=List[ChurnByInternet])
def get_churn_by_internet_service(
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    """Retrieve internet service breakdown with observed churn rates."""
    service = SQLAnalyticsService(db)
    return service.get_churn_by_internet(workspace.id)

@router.get("/tenure-cohorts", response_model=List[ChurnByTenureCohort])
def get_churn_by_tenure_cohorts(
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    """Retrieve customer tenure cohorts and cohort-specific churn rates."""
    service = SQLAnalyticsService(db)
    return service.get_churn_by_tenure_cohorts(workspace.id)

@router.get("/churn-trends", response_model=List[ChurnTrendPoint])
def get_churn_trends(
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    """Retrieve monthly customer churn and activity trends."""
    service = SQLAnalyticsService(db)
    return service.get_churn_trends_over_time(workspace.id)

@router.get("/risk-distribution", response_model=List[RiskTierDistribution])
def get_risk_distribution(
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    """Retrieve customer counts and revenue exposure grouped by ML predicted risk tiers."""
    service = SQLAnalyticsService(db)
    return service.get_risk_tier_distribution(workspace.id)

@router.get("/segments", response_model=List[SegmentPerformance])
def get_segment_breakdowns(
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    """Retrieve multi-dimensional customer segments and risk profiles."""
    service = SQLAnalyticsService(db)
    return service.get_segment_performances(workspace.id)
