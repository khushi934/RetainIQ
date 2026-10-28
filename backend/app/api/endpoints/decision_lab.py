from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.database import get_db
from app.models.entities import RetentionScenario, ScenarioResult, Workspace, User
from app.schemas.decision_lab import (
    ScenarioCreateRequest, ScenarioResultResponse, ScenarioDetailResponse,
    ScenarioComparisonRequest, ScenarioComparisonResponse
)
from app.services.decision_lab.simulator import RetentionDecisionSimulator
from app.api.deps import get_current_workspace, get_current_user

router = APIRouter(prefix="/decision-lab", tags=["Retention Decision Lab"])

@router.post("/calculate", response_model=ScenarioResultResponse)
def calculate_what_if_preview(
    req: ScenarioCreateRequest,
    db: Session = Depends(get_db)
):
    """
    Simulate scenario outcomes in real-time based on editable assumptions.
    Does not mutate database.
    """
    simulator = RetentionDecisionSimulator(db)
    results_dict, sensitivity = simulator.calculate_scenario(req)
    return ScenarioResultResponse(
        targeted_customers=results_dict["targeted_customers"],
        total_campaign_cost=results_dict["total_campaign_cost"],
        expected_incremental_retained=results_dict["expected_incremental_retained"],
        expected_incremental_revenue=results_dict["expected_incremental_revenue"],
        expected_net_benefit=results_dict["expected_net_benefit"],
        cost_per_incremental_retained=results_dict["cost_per_incremental_retained"],
        break_even_retention_uplift=results_dict["break_even_retention_uplift"],
        roi_pct=results_dict["roi_pct"],
        sensitivity_analysis=sensitivity,
        calculation_version=results_dict["calculation_version"],
        calculated_at=datetime.now(timezone.utc)
    )

@router.post("/scenarios", response_model=ScenarioDetailResponse, status_code=status.HTTP_201_CREATED)
def create_and_save_scenario(
    req: ScenarioCreateRequest,
    workspace: Workspace = Depends(get_current_workspace),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Calculate and persist scenario assumptions and results in MySQL."""
    simulator = RetentionDecisionSimulator(db)
    scenario = simulator.create_and_save_scenario(
        workspace_id=workspace.id,
        req=req,
        user_id=current_user.id
    )

    latest_res = db.scalar(
        select(ScenarioResult)
        .where(ScenarioResult.scenario_id == scenario.id)
        .order_by(ScenarioResult.id.desc())
    )
    detail = ScenarioDetailResponse.model_validate(scenario)
    if latest_res:
        detail.latest_result = ScenarioResultResponse.model_validate(latest_res)
    return detail

@router.get("/scenarios", response_model=List[ScenarioDetailResponse])
def list_scenarios(
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    """List all saved scenarios and their latest calculation outcomes for workspace."""
    scenarios = db.scalars(
        select(RetentionScenario)
        .where(RetentionScenario.workspace_id == workspace.id)
        .order_by(RetentionScenario.id.desc())
    ).all()

    items = []
    for s in scenarios:
        detail = ScenarioDetailResponse.model_validate(s)
        latest_res = db.scalar(
            select(ScenarioResult)
            .where(ScenarioResult.scenario_id == s.id)
            .order_by(ScenarioResult.id.desc())
        )
        if latest_res:
            detail.latest_result = ScenarioResultResponse.model_validate(latest_res)
        items.append(detail)
    return items

@router.get("/scenarios/{scenario_id}", response_model=ScenarioDetailResponse)
def get_scenario_details(
    scenario_id: int,
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    """Retrieve assumptions and sensitivity analysis for a specific saved scenario."""
    scenario = db.scalar(
        select(RetentionScenario)
        .where(RetentionScenario.id == scenario_id, RetentionScenario.workspace_id == workspace.id)
    )
    if not scenario:
        raise HTTPException(status_code=404, detail="Retention scenario not found.")

    latest_res = db.scalar(
        select(ScenarioResult)
        .where(ScenarioResult.scenario_id == scenario.id)
        .order_by(ScenarioResult.id.desc())
    )
    detail = ScenarioDetailResponse.model_validate(scenario)
    if latest_res:
        detail.latest_result = ScenarioResultResponse.model_validate(latest_res)
    return detail

@router.post("/compare", response_model=ScenarioComparisonResponse)
def compare_retention_scenarios(
    req: ScenarioComparisonRequest,
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    """Side-by-side comparison of 2 or more scenarios with trade-off analysis."""
    simulator = RetentionDecisionSimulator(db)
    try:
        return simulator.compare_scenarios(workspace.id, req.scenario_ids)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
