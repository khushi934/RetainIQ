from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, ConfigDict

class CustomerResponse(BaseModel):
    id: int
    workspace_id: int
    dataset_id: Optional[int] = None
    customer_identifier: str
    gender: Optional[str] = None
    senior_citizen: bool = False
    partner: Optional[str] = None
    dependents: Optional[str] = None
    tenure_months: int = 0
    phone_service: Optional[str] = None
    multiple_lines: Optional[str] = None
    internet_service: Optional[str] = None
    online_security: Optional[str] = None
    online_backup: Optional[str] = None
    device_protection: Optional[str] = None
    tech_support: Optional[str] = None
    streaming_tv: Optional[str] = None
    streaming_movies: Optional[str] = None
    contract_type: Optional[str] = None
    paperless_billing: Optional[str] = None
    payment_method: Optional[str] = None
    monthly_charges: float = 0.0
    total_charges: float = 0.0
    subscription_status: str
    last_activity_date: Optional[datetime] = None
    engagement_score: Optional[float] = None
    observed_churn: bool = False
    
    # Latest prediction if available
    latest_predicted_churn_probability: Optional[float] = None
    latest_risk_tier: Optional[str] = None
    top_contributing_factors: Optional[List[Any]] = None

    model_config = ConfigDict(from_attributes=True)

class CustomerListResponse(BaseModel):
    items: List[CustomerResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

class CustomerUpdate(BaseModel):
    subscription_status: Optional[str] = None
    contract_type: Optional[str] = None
    monthly_charges: Optional[float] = None
    engagement_score: Optional[float] = None
