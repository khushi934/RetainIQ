from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class CampaignCreate(BaseModel):
    name: str = Field(..., min_length=2)
    scenario_id: Optional[int] = None
    budget: float = Field(default=0.0, ge=0.0)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class OutcomeCreate(BaseModel):
    actual_contacts: int = Field(..., ge=0)
    actual_spend: float = Field(..., ge=0.0)
    observed_retentions: int = Field(..., ge=0)
    notes: Optional[str] = None

class CampaignResponse(BaseModel):
    id: int
    workspace_id: int
    scenario_id: Optional[int] = None
    name: str
    status: str
    budget: float
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    outcomes: List[Dict[str, Any]] = []
    model_config = ConfigDict(from_attributes=True)

class ReportCreate(BaseModel):
    title: str = Field(..., min_length=2)
    report_type: str = "executive_summary"
    content_json: Dict[str, Any]

class ReportResponse(BaseModel):
    id: int
    workspace_id: int
    title: str
    report_type: str
    content_json: Dict[str, Any]
    created_by: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class AssistantQuestionRequest(BaseModel):
    question: str = Field(..., min_length=2)
    workspace_id: Optional[int] = None
    context_filters: Optional[Dict[str, Any]] = None

class AssistantAnswerResponse(BaseModel):
    question: str
    answer: str
    verified_data: Dict[str, Any]
    limitations: List[str]
    suggested_actions: List[str]
    related_links: List[Dict[str, str]]
    source_type: str # "verified_backend_analytics" or "llm_grounded_response"
