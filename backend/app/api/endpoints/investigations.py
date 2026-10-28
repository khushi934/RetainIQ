from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.database import get_db
from app.models.entities import Investigation, InvestigationFinding, Workspace, User
from app.schemas.investigation import (
    InvestigationCreate, InvestigationResponse, FindingCreate, FindingResponse
)
from app.api.deps import get_current_workspace, get_current_user

router = APIRouter(prefix="/investigations", tags=["Churn Investigator"])

@router.post("", response_model=InvestigationResponse, status_code=status.HTTP_201_CREATED)
def create_investigation(
    req: InvestigationCreate,
    workspace: Workspace = Depends(get_current_workspace),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new churn investigation workspace with initial findings."""
    inv = Investigation(
        workspace_id=workspace.id,
        title=req.title,
        description=req.description,
        target_segment=req.target_segment,
        status="open",
        created_by=current_user.id
    )
    db.add(inv)
    db.flush()

    for f in req.findings:
        finding = InvestigationFinding(
            investigation_id=inv.id,
            finding_type=f.finding_type,
            title=f.title,
            summary=f.summary,
            data_evidence=f.data_evidence,
            confidence_level=f.confidence_level
        )
        db.add(finding)

    db.commit()
    db.refresh(inv)
    return InvestigationResponse.model_validate(inv)

@router.get("", response_model=List[InvestigationResponse])
def list_investigations(
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    """List all open and resolved investigations in workspace."""
    investigations = db.scalars(
        select(Investigation)
        .where(Investigation.workspace_id == workspace.id)
        .order_by(Investigation.id.desc())
    ).all()
    return [InvestigationResponse.model_validate(i) for i in investigations]

@router.get("/{investigation_id}", response_model=InvestigationResponse)
def get_investigation_details(
    investigation_id: int,
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    """Retrieve an investigation and all attached empirical evidence findings."""
    inv = db.scalar(
        select(Investigation)
        .where(Investigation.id == investigation_id, Investigation.workspace_id == workspace.id)
    )
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found.")
    return InvestigationResponse.model_validate(inv)

@router.post("/{investigation_id}/findings", response_model=FindingResponse, status_code=status.HTTP_201_CREATED)
def add_finding_to_investigation(
    investigation_id: int,
    req: FindingCreate,
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    """Add a verified data evidence finding to an active investigation."""
    inv = db.scalar(
        select(Investigation)
        .where(Investigation.id == investigation_id, Investigation.workspace_id == workspace.id)
    )
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found.")

    finding = InvestigationFinding(
        investigation_id=inv.id,
        finding_type=req.finding_type,
        title=req.title,
        summary=req.summary,
        data_evidence=req.data_evidence,
        confidence_level=req.confidence_level
    )
    db.add(finding)
    db.commit()
    db.refresh(finding)
    return FindingResponse.model_validate(finding)
