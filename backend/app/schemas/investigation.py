from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class FindingCreate(BaseModel):
    finding_type: str = Field(..., description="metric_anomaly, behavioral_pattern, model_insight, risk_cluster")
    title: str
    summary: str
    data_evidence: Optional[Dict[str, Any]] = None
    confidence_level: str = "medium"

class FindingResponse(BaseModel):
    id: int
    investigation_id: int
    finding_type: str
    title: str
    summary: str
    data_evidence: Optional[Dict[str, Any]] = None
    confidence_level: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class InvestigationCreate(BaseModel):
    title: str = Field(..., min_length=3)
    description: Optional[str] = None
    target_segment: Optional[str] = None
    findings: List[FindingCreate] = []

class InvestigationResponse(BaseModel):
    id: int
    workspace_id: int
    title: str
    description: Optional[str] = None
    target_segment: Optional[str] = None
    status: str
    created_by: int
    findings: List[FindingResponse] = []
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
