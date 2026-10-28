from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class ScenarioCreateRequest(BaseModel):
    name: str = Field(..., min_length=2)
    description: Optional[str] = None
    strategy_type: str = Field(default="discount_offer", description="discount_offer, proactive_outreach, service_upgrade, custom")
    target_segment: str = Field(..., description="e.g. High Risk Fiber Optic")
    eligible_customer_count: int = Field(..., ge=1)
    campaign_budget: float = Field(..., ge=0.0)
    contact_cost_per_customer: float = Field(..., ge=0.0)
    discount_amount_per_customer: float = Field(default=0.0, ge=0.0)
    assumed_response_rate: float = Field(..., ge=0.0, le=1.0)
    assumed_retention_uplift: float = Field(..., ge=0.0, le=1.0)
    revenue_per_retained_customer: float = Field(..., ge=0.0)
    campaign_capacity: Optional[int] = Field(default=None, ge=1)
    evaluation_period_months: int = Field(default=3, ge=1, le=36)

class SensitivityScenario(BaseModel):
    case_name: str # e.g. "Downside (-25% uplift)", "Base Case", "Upside (+25% uplift)"
    uplift: float
    incremental_retained: float
    incremental_revenue: float
    net_benefit: float
    roi_pct: float

class ScenarioResultResponse(BaseModel):
    id: Optional[int] = None
    scenario_id: Optional[int] = None
    targeted_customers: int
    total_campaign_cost: float
    expected_incremental_retained: float
    expected_incremental_revenue: float
    expected_net_benefit: float
    cost_per_incremental_retained: Optional[float] = None
    break_even_retention_uplift: Optional[float] = None
    roi_pct: float
    sensitivity_analysis: List[SensitivityScenario] = []
    calculation_version: str = "v1.0"
    calculated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ScenarioDetailResponse(BaseModel):
    id: int
    workspace_id: int
    name: str
    description: Optional[str] = None
    strategy_type: str
    target_segment: str
    eligible_customer_count: int
    campaign_budget: float
    contact_cost_per_customer: float
    discount_amount_per_customer: float
    assumed_response_rate: float
    assumed_retention_uplift: float
    revenue_per_retained_customer: float
    campaign_capacity: Optional[int] = None
    evaluation_period_months: int
    latest_result: Optional[ScenarioResultResponse] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ScenarioComparisonRequest(BaseModel):
    scenario_ids: List[int] = Field(..., min_length=2)

class ScenarioComparisonItem(BaseModel):
    scenario_id: int
    name: str
    strategy_type: str
    target_segment: str
    targeted_customers: int
    total_campaign_cost: float
    expected_incremental_retained: float
    expected_incremental_revenue: float
    expected_net_benefit: float
    cost_per_incremental_retained: Optional[float] = None
    break_even_retention_uplift: Optional[float] = None
    roi_pct: float
    budget_utilization_pct: float
    assumed_uplift: float

class ScenarioComparisonResponse(BaseModel):
    scenarios: List[ScenarioComparisonItem]
    best_net_benefit_scenario_id: int
    lowest_cost_per_retained_scenario_id: int
    methodology_notes: List[str]
