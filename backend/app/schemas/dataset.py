from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class ColumnMapping(BaseModel):
    customer_identifier: str = "customerID"
    tenure_months: str = "tenure"
    monthly_charges: str = "MonthlyCharges"
    total_charges: str = "TotalCharges"
    contract_type: str = "Contract"
    observed_churn: str = "Churn"
    internet_service: Optional[str] = "InternetService"
    payment_method: Optional[str] = "PaymentMethod"
    subscription_status: Optional[str] = "SubscriptionStatus"
    last_activity_date: Optional[str] = "LastActivityDate"
    engagement_score: Optional[str] = "EngagementScore"
    gender: Optional[str] = "gender"
    senior_citizen: Optional[str] = "SeniorCitizen"
    partner: Optional[str] = "Partner"
    dependents: Optional[str] = "Dependents"
    phone_service: Optional[str] = "PhoneService"
    multiple_lines: Optional[str] = "MultipleLines"
    online_security: Optional[str] = "OnlineSecurity"
    online_backup: Optional[str] = "OnlineBackup"
    device_protection: Optional[str] = "DeviceProtection"
    tech_support: Optional[str] = "TechSupport"
    streaming_tv: Optional[str] = "StreamingTV"
    streaming_movies: Optional[str] = "StreamingMovies"
    paperless_billing: Optional[str] = "PaperlessBilling"

class CSVPreviewResponse(BaseModel):
    filename: str
    file_size_bytes: int
    detected_columns: List[str]
    suggested_mapping: Dict[str, str]
    preview_rows: List[Dict[str, Any]]
    total_preview_count: int

class ValidationErrorDetail(BaseModel):
    row_number: int
    customer_identifier: Optional[str] = None
    field_name: str
    invalid_value: Any
    reason: str

class CSVImportValidationResponse(BaseModel):
    can_import: bool
    total_rows_inspected: int
    valid_rows_count: int
    invalid_rows_count: int
    duplicate_id_count: int
    errors: List[ValidationErrorDetail]

class CSVConfirmImportRequest(BaseModel):
    filename: str
    dataset_name: str
    column_mapping: ColumnMapping

class DatasetResponse(BaseModel):
    id: int
    workspace_id: int
    name: str
    filename: str
    file_size_bytes: int
    row_count: int
    column_count: int
    status: str
    churn_definition: str
    summary_metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class DataQualityReport(BaseModel):
    dataset_id: int
    dataset_name: str
    total_rows: int
    accepted_rows: int
    rejected_rows: int
    missing_values_by_column: Dict[str, int]
    duplicate_identifiers_count: int
    invalid_dates_count: int
    invalid_numeric_count: int
    churn_label_distribution: Dict[str, int]
    observed_churn_rate_pct: float
    potential_target_leakage_warnings: List[str]
    data_freshness_status: str
    quality_score: float # 0 - 100
    beginner_explanation: str
