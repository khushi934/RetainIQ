from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.database import get_db
from app.models.entities import Campaign, CampaignOutcome, Workspace, RetentionScenario
from app.schemas.report import CampaignCreate, CampaignResponse, OutcomeCreate
from app.api.deps import get_current_workspace

router = APIRouter(prefix="/campaigns", tags=["Campaigns"])

@router.post("", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
def create_campaign(
    req: CampaignCreate,
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    """Create a new live retention campaign linked optionally to a Decision Lab scenario."""
    campaign = Campaign(
        workspace_id=workspace.id,
        scenario_id=req.scenario_id,
        name=req.name,
        status="active",
        budget=req.budget,
        start_date=req.start_date or datetime.now(timezone.utc),
        end_date=req.end_date
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return CampaignResponse.model_validate(campaign)

@router.get("", response_model=List[CampaignResponse])
def list_campaigns(
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    """List retention campaigns and observed historical outcomes."""
    campaigns = db.scalars(
        select(Campaign)
        .where(Campaign.workspace_id == workspace.id)
        .order_by(Campaign.id.desc())
    ).all()
    return [CampaignResponse.model_validate(c) for c in campaigns]

@router.post("/{campaign_id}/outcomes", status_code=status.HTTP_201_CREATED)
def record_campaign_outcome(
    campaign_id: int,
    req: OutcomeCreate,
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    """Record observed real-world campaign outcome to compare against simulation."""
    campaign = db.scalar(
        select(Campaign)
        .where(Campaign.id == campaign_id, Campaign.workspace_id == workspace.id)
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found.")

    retention_rate = round(req.observed_retentions / req.actual_contacts * 100, 2) if req.actual_contacts > 0 else 0.0
    outcome = CampaignOutcome(
        campaign_id=campaign.id,
        actual_contacts=req.actual_contacts,
        actual_spend=req.actual_spend,
        observed_retentions=req.observed_retentions,
        observed_retention_rate=retention_rate,
        notes=req.notes
    )
    db.add(outcome)
    campaign.status = "completed"
    db.commit()
    db.refresh(outcome)
    return {"message": "Campaign outcome recorded successfully.", "outcome_id": outcome.id}
