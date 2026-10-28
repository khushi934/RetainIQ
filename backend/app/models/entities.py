from datetime import datetime, timezone
from typing import Optional, List, Any
from sqlalchemy import (
    Column, Integer, String, Boolean, Float, Text, DateTime, Date, 
    ForeignKey, JSON, Index, func
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.core.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="analyst", nullable=False)  # admin, analyst, viewer
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    workspaces = relationship("Workspace", back_populates="owner", cascade="all, delete-orphan")
    investigations = relationship("Investigation", back_populates="creator")
    scenarios = relationship("RetentionScenario", back_populates="creator")
    reports = relationship("Report", back_populates="creator")


class Workspace(Base):
    __tablename__ = "workspaces"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    owner_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    owner = relationship("User", back_populates="workspaces")
    datasets = relationship("Dataset", back_populates="workspace", cascade="all, delete-orphan")
    customers = relationship("Customer", back_populates="workspace", cascade="all, delete-orphan")
    model_versions = relationship("ModelVersion", back_populates="workspace", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="workspace", cascade="all, delete-orphan")
    investigations = relationship("Investigation", back_populates="workspace", cascade="all, delete-orphan")
    scenarios = relationship("RetentionScenario", back_populates="workspace", cascade="all, delete-orphan")
    campaigns = relationship("Campaign", back_populates="workspace", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="workspace", cascade="all, delete-orphan")
    audit_events = relationship("AuditEvent", back_populates="workspace", cascade="all, delete-orphan")


class Dataset(Base):
    __tablename__ = "datasets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    workspace_id: Mapped[int] = mapped_column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    row_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    column_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="uploaded", nullable=False) # uploaded, validating, imported, failed
    churn_definition: Mapped[str] = mapped_column(String(255), default="Observed historical churn label (Churn == Yes)", nullable=False)
    summary_metadata: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)

    workspace = relationship("Workspace", back_populates="datasets")
    import_jobs = relationship("DataImportJob", back_populates="dataset", cascade="all, delete-orphan")
    customers = relationship("Customer", back_populates="dataset", cascade="all, delete-orphan")


class DataImportJob(Base):
    __tablename__ = "data_import_jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    dataset_id: Mapped[int] = mapped_column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"), index=True, nullable=False)
    workspace_id: Mapped[int] = mapped_column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False) # pending, processing, completed, failed
    total_rows: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    accepted_rows: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    rejected_rows: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    error_log: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    dataset = relationship("Dataset", back_populates="import_jobs")


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    workspace_id: Mapped[int] = mapped_column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=False)
    dataset_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("datasets.id", ondelete="SET NULL"), index=True, nullable=True)
    
    customer_identifier: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    gender: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    senior_citizen: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    partner: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    dependents: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    tenure_months: Mapped[int] = mapped_column(Integer, default=0, index=True, nullable=False)
    
    phone_service: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    multiple_lines: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    internet_service: Mapped[Optional[str]] = mapped_column(String(50), index=True, nullable=True) # DSL, Fiber optic, No
    online_security: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    online_backup: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    device_protection: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    tech_support: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    streaming_tv: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    streaming_movies: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    contract_type: Mapped[Optional[str]] = mapped_column(String(100), index=True, nullable=True) # Month-to-month, One year, Two year
    paperless_billing: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    payment_method: Mapped[Optional[str]] = mapped_column(String(100), index=True, nullable=True)
    
    monthly_charges: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    total_charges: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    subscription_status: Mapped[str] = mapped_column(String(50), default="Active", index=True, nullable=False)
    last_activity_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    engagement_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True) # 0 to 100
    
    observed_churn: Mapped[bool] = mapped_column(Boolean, default=False, index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    workspace = relationship("Workspace", back_populates="customers")
    dataset = relationship("Dataset", back_populates="customers")
    predictions = relationship("Prediction", back_populates="customer", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_workspace_customer", "workspace_id", "customer_identifier", unique=True),
        Index("idx_workspace_churn", "workspace_id", "observed_churn"),
        Index("idx_workspace_contract", "workspace_id", "contract_type"),
    )


class ModelVersion(Base):
    __tablename__ = "model_versions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    workspace_id: Mapped[int] = mapped_column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=False)
    version_code: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    algorithm_name: Mapped[str] = mapped_column(String(100), nullable=False)
    target_column: Mapped[str] = mapped_column(String(100), default="observed_churn", nullable=False)
    target_definition: Mapped[str] = mapped_column(Text, nullable=False)
    training_sample_size: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    test_sample_size: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    features_used: Mapped[list] = mapped_column(JSON, nullable=False)
    evaluation_metrics: Mapped[dict] = mapped_column(JSON, nullable=False)
    feature_importances: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    artifact_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)

    workspace = relationship("Workspace", back_populates="model_versions")
    predictions = relationship("Prediction", back_populates="model_version", cascade="all, delete-orphan")


class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id: Mapped[int] = mapped_column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), index=True, nullable=False)
    model_version_id: Mapped[int] = mapped_column(Integer, ForeignKey("model_versions.id", ondelete="CASCADE"), index=True, nullable=False)
    workspace_id: Mapped[int] = mapped_column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=False)
    
    predicted_churn_probability: Mapped[float] = mapped_column(Float, nullable=False)
    predicted_churn_label: Mapped[bool] = mapped_column(Boolean, nullable=False)
    risk_tier: Mapped[str] = mapped_column(String(50), index=True, nullable=False) # Low, Medium, High
    top_contributing_factors: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    prediction_timestamp: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)

    customer = relationship("Customer", back_populates="predictions")
    model_version = relationship("ModelVersion", back_populates="predictions")
    workspace = relationship("Workspace", back_populates="predictions")

    __table_args__ = (
        Index("idx_workspace_risk", "workspace_id", "risk_tier"),
        Index("idx_customer_model", "customer_id", "model_version_id"),
    )


class Investigation(Base):
    __tablename__ = "investigations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    workspace_id: Mapped[int] = mapped_column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    target_segment: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="open", nullable=False) # open, in_progress, resolved, archived
    created_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    workspace = relationship("Workspace", back_populates="investigations")
    creator = relationship("User", back_populates="investigations")
    findings = relationship("InvestigationFinding", back_populates="investigation", cascade="all, delete-orphan")


class InvestigationFinding(Base):
    __tablename__ = "investigation_findings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    investigation_id: Mapped[int] = mapped_column(Integer, ForeignKey("investigations.id", ondelete="CASCADE"), index=True, nullable=False)
    finding_type: Mapped[str] = mapped_column(String(100), nullable=False) # metric_anomaly, behavioral_pattern, model_insight, risk_cluster
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    data_evidence: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    confidence_level: Mapped[str] = mapped_column(String(50), default="medium", nullable=False) # low, medium, high
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)

    investigation = relationship("Investigation", back_populates="findings")


class RetentionScenario(Base):
    __tablename__ = "retention_scenarios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    workspace_id: Mapped[int] = mapped_column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    strategy_type: Mapped[str] = mapped_column(String(100), default="discount_offer", nullable=False) # discount_offer, proactive_outreach, service_upgrade, custom
    target_segment: Mapped[str] = mapped_column(String(255), nullable=False)
    
    eligible_customer_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    campaign_budget: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    contact_cost_per_customer: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    discount_amount_per_customer: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    assumed_response_rate: Mapped[float] = mapped_column(Float, default=0.0, nullable=False) # 0.0 - 1.0
    assumed_retention_uplift: Mapped[float] = mapped_column(Float, default=0.0, nullable=False) # 0.0 - 1.0
    revenue_per_retained_customer: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    campaign_capacity: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    evaluation_period_months: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    
    created_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    workspace = relationship("Workspace", back_populates="scenarios")
    creator = relationship("User", back_populates="scenarios")
    results = relationship("ScenarioResult", back_populates="scenario", cascade="all, delete-orphan")
    campaigns = relationship("Campaign", back_populates="scenario")


class ScenarioResult(Base):
    __tablename__ = "scenario_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    scenario_id: Mapped[int] = mapped_column(Integer, ForeignKey("retention_scenarios.id", ondelete="CASCADE"), index=True, nullable=False)
    
    targeted_customers: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_campaign_cost: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    expected_incremental_retained: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    expected_incremental_revenue: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    expected_net_benefit: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    cost_per_incremental_retained: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    break_even_retention_uplift: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    sensitivity_analysis: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    calculation_version: Mapped[str] = mapped_column(String(50), default="v1.0", nullable=False)
    calculated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)

    scenario = relationship("RetentionScenario", back_populates="results")


class Campaign(Base):
    __tablename__ = "campaigns"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    workspace_id: Mapped[int] = mapped_column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=False)
    scenario_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("retention_scenarios.id", ondelete="SET NULL"), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="draft", nullable=False) # draft, active, completed, cancelled
    budget: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    workspace = relationship("Workspace", back_populates="campaigns")
    scenario = relationship("RetentionScenario", back_populates="campaigns")
    outcomes = relationship("CampaignOutcome", back_populates="campaign", cascade="all, delete-orphan")


class CampaignOutcome(Base):
    __tablename__ = "campaign_outcomes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    campaign_id: Mapped[int] = mapped_column(Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), index=True, nullable=False)
    actual_contacts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    actual_spend: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    observed_retentions: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    observed_retention_rate: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    observed_roi: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)

    campaign = relationship("Campaign", back_populates="outcomes")


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    workspace_id: Mapped[int] = mapped_column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    report_type: Mapped[str] = mapped_column(String(100), default="executive_summary", nullable=False)
    content_json: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)

    workspace = relationship("Workspace", back_populates="reports")
    creator = relationship("User", back_populates="reports")


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    workspace_id: Mapped[int] = mapped_column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    event_type: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    entity_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    entity_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    details: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True, nullable=False)

    workspace = relationship("Workspace", back_populates="audit_events")
