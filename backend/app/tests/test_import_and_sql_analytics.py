import os
import pytest
import pandas as pd
from app.services.import_service import CSVImportService
from app.services.analytics.sql_analytics import SQLAnalyticsService
from app.schemas.dataset import ColumnMapping
from app.models.entities import Customer, Dataset

SAMPLE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "sample_data"))
CLEAN_CSV_PATH = os.path.join(SAMPLE_DIR, "telco_customer_churn.csv")
ERRORS_CSV_PATH = os.path.join(SAMPLE_DIR, "telco_sample_with_errors.csv")

def test_csv_preview_and_mapping(db_session):
    """Test previewing CSV headers, delimiter detection, and auto-mapping."""
    with open(CLEAN_CSV_PATH, "rb") as f:
        content = f.read()

    service = CSVImportService(db_session)
    preview = service.preview_csv_content(content, "telco_customer_churn.csv")

    assert preview.total_preview_count == 10
    assert "customerID" in preview.detected_columns
    assert "Churn" in preview.detected_columns
    assert preview.suggested_mapping["customer_identifier"] == "customerID"
    assert preview.suggested_mapping["tenure_months"] == "tenure"
    assert preview.suggested_mapping["monthly_charges"] == "MonthlyCharges"

def test_csv_validation_with_known_errors(db_session, clean_workspace):
    """Test validation detects missing IDs, invalid numbers, negative tenure, invalid dates, and duplicates."""
    with open(ERRORS_CSV_PATH, "rb") as f:
        content = f.read()

    mapping = ColumnMapping()
    service = CSVImportService(db_session)
    validation, valid_rows, errors = service.validate_csv(content, mapping, clean_workspace.id)

    assert validation.can_import is True
    assert validation.valid_rows_count == 50 # 50 normal rows
    assert validation.invalid_rows_count >= 5 # 5 injected error rows

    reasons = [e.reason for e in errors]
    assert any("Customer identifier is required" in r for r in reasons)
    assert any("Monthly charges must be a valid decimal number" in r for r in reasons)
    assert any("Tenure months must be a non-negative number" in r for r in reasons)
    assert any("Activity date must be a valid date" in r for r in reasons)
    assert any("Duplicate" in r for r in reasons)

def test_transactional_import_and_sql_analytics(db_session, clean_workspace):
    """Test full transactional import into MySQL and verify SQL analytics against Pandas ground truth."""
    workspace = clean_workspace

    with open(CLEAN_CSV_PATH, "rb") as f:
        content = f.read()

    mapping = ColumnMapping()
    service = CSVImportService(db_session)
    dataset, job, quality_report = service.execute_import(
        workspace_id=workspace.id,
        dataset_name="IBM Telco Benchmark",
        filename="telco_customer_churn.csv",
        content_bytes=content,
        mapping=mapping
    )

    assert dataset.id is not None
    assert dataset.row_count == 1000
    assert job.status == "completed"
    assert job.accepted_rows == 1000
    assert job.rejected_rows == 0
    assert quality_report.accepted_rows == 1000
    assert quality_report.quality_score >= 90.0

    # Calculate ground truth directly from CSV using Pandas
    df = pd.read_csv(CLEAN_CSV_PATH)
    ground_total = len(df)
    ground_churn_count = sum(df["Churn"].str.lower() == "yes")
    ground_churn_rate = round(ground_churn_count / ground_total * 100, 2)
    ground_mrr = round(float(df["MonthlyCharges"].sum()), 2)
    ground_avg_tenure = round(float(df["tenure"].mean()), 1)

    # Execute SQL Analytics Service
    analytics_service = SQLAnalyticsService(db_session)
    overview = analytics_service.get_overview_metrics(workspace.id)

    assert overview.total_customers == ground_total
    assert overview.churned_customers == ground_churn_count
    assert overview.observed_churn_rate_pct == ground_churn_rate
    assert abs(overview.monthly_recurring_revenue - ground_mrr) < 0.1
    assert abs(overview.avg_tenure_months - ground_avg_tenure) < 0.2
    assert overview.observed_retention_rate_pct == round(100.0 - ground_churn_rate, 2)

    # Test contract breakdown
    contract_stats = analytics_service.get_churn_by_contract(workspace.id)
    assert len(contract_stats) >= 3
    total_in_contracts = sum(c.total_customers for c in contract_stats)
    assert total_in_contracts == 1000

    # Test tenure cohorts
    cohorts = analytics_service.get_churn_by_tenure_cohorts(workspace.id)
    assert len(cohorts) > 0
    total_in_cohorts = sum(c.total_customers for c in cohorts)
    assert total_in_cohorts == 1000

    # Test multi-dimensional segments
    segments = analytics_service.get_segment_performances(workspace.id)
    assert len(segments) > 0
    assert all(s.customer_count >= 5 for s in segments)
