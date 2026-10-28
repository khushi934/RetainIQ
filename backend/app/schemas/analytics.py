from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class OverviewMetrics(BaseModel):
    total_customers: int
    active_customers: int
    churned_customers: int
    observed_churn_rate_pct: float
    observed_retention_rate_pct: float
    avg_tenure_months: float
    median_tenure_months: float
    monthly_recurring_revenue: float
    avg_revenue_per_customer: float
    revenue_at_risk: float
    high_risk_customers_count: int
    predicted_churn_rate_pct: Optional[float] = None

class ChurnByContract(BaseModel):
    contract_type: str
    total_customers: int
    churned_customers: int
    churn_rate_pct: float
    mrr: float

class ChurnByInternet(BaseModel):
    internet_service: str
    total_customers: int
    churned_customers: int
    churn_rate_pct: float

class ChurnByTenureCohort(BaseModel):
    cohort_range: str # e.g. "0-6 months", "7-12 months", "13-24 months", "25-48 months", "49+ months"
    total_customers: int
    churned_customers: int
    churn_rate_pct: float

class ChurnTrendPoint(BaseModel):
    period: str # Month or Date
    new_customers: int
    churned_customers: int
    active_customers: int
    churn_rate_pct: float

class RiskTierDistribution(BaseModel):
    risk_tier: str # "Low", "Medium", "High", "Unscored"
    customer_count: int
    percentage: float
    revenue_sum: float

class SegmentPerformance(BaseModel):
    segment_name: str
    customer_count: int
    churned_count: int
    churn_rate_pct: float
    avg_monthly_charges: float
    total_revenue: float
    risk_profile: str # Low, Moderate, Elevated, Critical
