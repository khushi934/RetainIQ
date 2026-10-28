import io
import csv
from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.database import get_db
from app.models.entities import Report, Workspace, User
from app.schemas.report import ReportCreate, ReportResponse
from app.services.analytics.sql_analytics import SQLAnalyticsService
from app.api.deps import get_current_workspace, get_current_user

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post("/generate-executive", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def generate_executive_audit_report(
    workspace: Workspace = Depends(get_current_workspace),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Compile verified SQL analytics, churn definitions, risk exposures,
    and methodology limitations into a persistent audit report.
    """
    analytics = SQLAnalyticsService(db)
    overview = analytics.get_overview_metrics(workspace.id)
    contracts = analytics.get_churn_by_contract(workspace.id)
    segments = analytics.get_segment_performances(workspace.id)

    content = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "workspace_name": workspace.name,
        "executive_summary": (
            f"RetainIQ retention audit conducted across {overview.total_customers} customer accounts. "
            f"Observed historical churn rate is {overview.observed_churn_rate_pct}% ({overview.churned_customers} accounts). "
            f"Total monthly recurring revenue is ${overview.monthly_recurring_revenue:,.2f}, with "
            f"${overview.revenue_at_risk:,.2f} identified at elevated predicted risk."
        ),
        "kpis": overview.model_dump(),
        "contract_breakdown": [c.model_dump() for c in contracts],
        "high_risk_segments": [s.model_dump() for s in segments[:5]],
        "methodological_safeguards": [
            "Metrics reflect verified MySQL ground truth without synthetic fabrication.",
            "Predictions are statistical estimates; correlations do not prove causality.",
            "Retention campaigns must be validated with randomized holdout groups."
        ]
    }

    report = Report(
        workspace_id=workspace.id,
        title=f"Executive Retention Intelligence Report — {datetime.now().strftime('%B %Y')}",
        report_type="executive_summary",
        content_json=content,
        created_by=current_user.id
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return ReportResponse.model_validate(report)

@router.get("", response_model=List[ReportResponse])
def list_reports(
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    """List all saved reports in workspace."""
    reports = db.scalars(
        select(Report).where(Report.workspace_id == workspace.id).order_by(Report.id.desc())
    ).all()
    return [ReportResponse.model_validate(r) for r in reports]

@router.get("/{report_id}", response_model=ReportResponse)
def get_report(
    report_id: int,
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    """Retrieve full content of a saved report."""
    report = db.scalar(
        select(Report).where(Report.id == report_id, Report.workspace_id == workspace.id)
    )
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    return ReportResponse.model_validate(report)

@router.get("/{report_id}/download")
def download_report_csv(
    report_id: int,
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    """Export report metrics and findings as CSV."""
    report = db.scalar(
        select(Report).where(Report.id == report_id, Report.workspace_id == workspace.id)
    )
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["RetainIQ Executive Retention Report", report.title])
    writer.writerow(["Generated At", report.created_at.strftime("%Y-%m-%d %H:%M:%S")])
    writer.writerow([])

    content = report.content_json
    if "kpis" in content:
        writer.writerow(["--- OVERVIEW METRICS ---"])
        for k, v in content["kpis"].items():
            writer.writerow([k, v])
        writer.writerow([])

    if "high_risk_segments" in content:
        writer.writerow(["--- HIGH RISK SEGMENTS ---"])
        writer.writerow(["Segment Name", "Customers", "Churn Rate (%)", "Total Revenue ($)", "Risk Profile"])
        for s in content["high_risk_segments"]:
            writer.writerow([s.get("segment_name"), s.get("customer_count"), s.get("churn_rate_pct"), s.get("total_revenue"), s.get("risk_profile")])

    csv_data = output.getvalue()
    filename = f"retainiq_report_{report.id}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
