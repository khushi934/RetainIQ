from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class ModelTrainRequest(BaseModel):
    algorithm: str = Field(default="random_forest", description="random_forest or logistic_regression")
    test_size: float = Field(default=0.2, ge=0.1, le=0.4)
    target_column: str = "observed_churn"
    features: Optional[List[str]] = None

class EvaluationMetrics(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: Optional[float] = None
    baseline_churn_rate: float
    confusion_matrix: Dict[str, int] # true_negatives, false_positives, false_negatives, true_positives
    class_distribution: Dict[str, int]
    methodology: str

class ModelVersionResponse(BaseModel):
    id: int
    workspace_id: int
    version_code: str
    algorithm_name: str
    target_column: str
    target_definition: str
    training_sample_size: int
    test_sample_size: int
    features_used: List[str]
    evaluation_metrics: EvaluationMetrics
    feature_importances: Optional[Dict[str, float]] = None
    is_active: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ModelPredictionBatchRequest(BaseModel):
    model_version_id: Optional[int] = None
    customer_ids: Optional[List[int]] = None
    filter_unpredicted_only: bool = False

class PredictionResponse(BaseModel):
    id: int
    customer_id: int
    customer_identifier: str
    predicted_churn_probability: float
    predicted_churn_label: bool
    risk_tier: str
    top_contributing_factors: Optional[List[Dict[str, Any]]] = None
    prediction_timestamp: datetime
    model_config = ConfigDict(from_attributes=True)
