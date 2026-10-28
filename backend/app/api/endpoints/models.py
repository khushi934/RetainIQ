from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.database import get_db
from app.models.entities import ModelVersion, Workspace
from app.schemas.model import (
    ModelTrainRequest, ModelVersionResponse, EvaluationMetrics,
    ModelPredictionBatchRequest
)
from app.services.churn_model.pipeline import ChurnModelPipeline
from app.api.deps import get_current_workspace

router = APIRouter(prefix="/models", tags=["Machine Learning"])

@router.post("/train", response_model=ModelVersionResponse, status_code=status.HTTP_201_CREATED)
def train_new_churn_model(
    req: ModelTrainRequest,
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    """
    Train a genuine Scikit-learn churn classification model with train/test isolation.
    Persists model artifact and records full evaluation metrics in MySQL.
    """
    service = ChurnModelPipeline(db)
    try:
        model = service.train_model(
            workspace_id=workspace.id,
            algorithm=req.algorithm,
            test_size=req.test_size
        )
        return ModelVersionResponse.model_validate(model)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Model training failed: {str(e)}")

@router.get("", response_model=List[ModelVersionResponse])
def list_models(
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    """List all trained model versions for current workspace."""
    models = db.scalars(
        select(ModelVersion)
        .where(ModelVersion.workspace_id == workspace.id)
        .order_by(ModelVersion.id.desc())
    ).all()
    return [ModelVersionResponse.model_validate(m) for m in models]

@router.get("/{model_id}", response_model=ModelVersionResponse)
def get_model_details(
    model_id: int,
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    """Retrieve metadata, metrics, and feature importances for a specific model version."""
    model = db.scalar(
        select(ModelVersion).where(ModelVersion.id == model_id, ModelVersion.workspace_id == workspace.id)
    )
    if not model:
        raise HTTPException(status_code=404, detail="Model version not found.")
    return ModelVersionResponse.model_validate(model)

@router.post("/{model_id}/predict")
def run_batch_predictions(
    model_id: int,
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    """Re-run churn prediction inference across workspace customers using saved model artifact."""
    service = ChurnModelPipeline(db)
    try:
        count = service.generate_predictions_for_workspace(workspace.id, model_id)
        return {"message": f"Successfully generated {count} customer risk predictions.", "predicted_count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
