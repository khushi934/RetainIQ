import os
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.database import get_db
from app.models.entities import Dataset, Workspace, Customer, User
from app.schemas.dataset import (
    CSVPreviewResponse, CSVImportValidationResponse, DatasetResponse,
    DataQualityReport, ColumnMapping
)
from app.services.import_service import CSVImportService
from app.api.deps import get_current_workspace, get_current_user

router = APIRouter(prefix="/datasets", tags=["Datasets"])

SAMPLE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "sample_data"))
BENCHMARK_CSV = os.path.join(SAMPLE_DIR, "telco_customer_churn.csv")

@router.post("/preview", response_model=CSVPreviewResponse)
async def preview_csv_upload(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Inspect CSV file, detect delimiter, suggest column mapping, and return preview rows."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be a CSV format (.csv)."
        )

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )

    service = CSVImportService(db)
    preview = service.preview_csv_content(content, file.filename)
    return preview

@router.post("/import", response_model=DataQualityReport, status_code=status.HTTP_201_CREATED)
async def import_customer_dataset(
    file: UploadFile = File(...),
    dataset_name: str = Form(...),
    mapping_json: Optional[str] = Form(None),
    workspace: Workspace = Depends(get_current_workspace),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Validate and execute transactional import of customer CSV dataset into MySQL.
    Returns complete Data Quality Report.
    """
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    if mapping_json:
        try:
            mapping_dict = json.loads(mapping_json)
            mapping = ColumnMapping(**mapping_dict)
        except Exception:
            mapping = ColumnMapping()
    else:
        mapping = ColumnMapping()

    service = CSVImportService(db)
    dataset, job, quality_report = service.execute_import(
        workspace_id=workspace.id,
        dataset_name=dataset_name,
        filename=file.filename,
        content_bytes=content,
        mapping=mapping,
        user_id=current_user.id
    )
    return quality_report

@router.post("/load-sample", response_model=DataQualityReport, status_code=status.HTTP_201_CREATED)
def load_sample_benchmark_dataset(
    workspace: Workspace = Depends(get_current_workspace),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    One-click import of the 1,000-row IBM Telco Customer Churn benchmark dataset.
    Creates records in MySQL and generates an instant Data Quality Report.
    """
    if not os.path.exists(BENCHMARK_CSV):
        raise HTTPException(status_code=404, detail="Benchmark sample dataset file not found on disk.")

    with open(BENCHMARK_CSV, "rb") as f:
        content = f.read()

    mapping = ColumnMapping()
    service = CSVImportService(db)
    dataset, job, quality_report = service.execute_import(
        workspace_id=workspace.id,
        dataset_name="IBM Telco Customer Churn (Benchmark)",
        filename="telco_customer_churn.csv",
        content_bytes=content,
        mapping=mapping,
        user_id=current_user.id
    )
    return quality_report

@router.get("", response_model=List[DatasetResponse])
def list_datasets(
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    """List all imported customer datasets for current workspace."""
    datasets = db.scalars(
        select(Dataset).where(Dataset.workspace_id == workspace.id).order_by(Dataset.id.desc())
    ).all()
    return [DatasetResponse.model_validate(d) for d in datasets]

@router.get("/{dataset_id}", response_model=DatasetResponse)
def get_dataset(
    dataset_id: int,
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    """Retrieve metadata for a specific dataset."""
    dataset = db.scalar(
        select(Dataset).where(Dataset.id == dataset_id, Dataset.workspace_id == workspace.id)
    )
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")
    return DatasetResponse.model_validate(dataset)

@router.get("/{dataset_id}/quality", response_model=DataQualityReport)
def get_dataset_quality(
    dataset_id: int,
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    """Generate and return comprehensive Data Quality Report for a dataset."""
    service = CSVImportService(db)
    return service.generate_quality_report(dataset_id)
