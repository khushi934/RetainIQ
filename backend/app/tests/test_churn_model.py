import os
import pytest
from app.services.import_service import CSVImportService
from app.services.churn_model.pipeline import ChurnModelPipeline, LEAKAGE_COLUMNS
from app.schemas.dataset import ColumnMapping
from app.models.entities import ModelVersion, Prediction

SAMPLE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "sample_data"))
CLEAN_CSV_PATH = os.path.join(SAMPLE_DIR, "telco_customer_churn.csv")

def test_ml_pipeline_training_and_evaluation(db_session, clean_workspace):
    """Test full Scikit-learn ML training, evaluation metrics, and persistence in MySQL."""
    # 1. Import dataset
    with open(CLEAN_CSV_PATH, "rb") as f:
        content = f.read()

    mapping = ColumnMapping()
    import_service = CSVImportService(db_session)
    import_service.execute_import(
        workspace_id=clean_workspace.id,
        dataset_name="ML Benchmark Dataset",
        filename="telco_customer_churn.csv",
        content_bytes=content,
        mapping=mapping
    )

    # 2. Train model
    pipeline_service = ChurnModelPipeline(db_session)
    model = pipeline_service.train_model(
        workspace_id=clean_workspace.id,
        algorithm="random_forest",
        test_size=0.2
    )

    assert model.id is not None
    assert model.version_code.startswith("v")
    assert model.algorithm_name.startswith("Random Forest")
    assert model.training_sample_size == 800
    assert model.test_sample_size == 200

    # Verify no data leakage in features used
    for col in LEAKAGE_COLUMNS:
        assert col not in model.features_used

    # Verify evaluation metrics
    metrics = model.evaluation_metrics
    assert "accuracy" in metrics
    assert "precision" in metrics
    assert "recall" in metrics
    assert "f1_score" in metrics
    assert "roc_auc" in metrics
    assert "confusion_matrix" in metrics
    assert metrics["roc_auc"] > 0.65
    assert metrics["f1_score"] > 0.40

    cm = metrics["confusion_matrix"]
    assert cm["true_negatives"] + cm["false_positives"] + cm["false_negatives"] + cm["true_positives"] == 200

    # Verify Joblib artifact persisted on filesystem
    assert os.path.exists(model.artifact_path)

    # Verify predictions were generated and persisted in MySQL
    predictions = db_session.query(Prediction).filter(
        Prediction.workspace_id == clean_workspace.id,
        Prediction.model_version_id == model.id
    ).all()

    assert len(predictions) == 1000
    for p in predictions[:10]:
        assert 0.0 <= p.predicted_churn_probability <= 1.0
        assert p.risk_tier in ["Low", "Medium", "High"]
        assert p.top_contributing_factors is not None
        assert len(p.top_contributing_factors) > 0

def test_ml_pipeline_handles_insufficient_data(db_session, clean_workspace):
    """Test error handling when trying to train model on insufficient data."""
    pipeline_service = ChurnModelPipeline(db_session)
    with pytest.raises(ValueError, match="Insufficient customer records"):
        pipeline_service.train_model(workspace_id=clean_workspace.id)
