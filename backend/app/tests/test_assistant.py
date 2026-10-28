import os
import pytest
from app.services.import_service import CSVImportService
from app.services.churn_model.pipeline import ChurnModelPipeline
from app.services.ai.assistant import RetainIQAnalystAssistant
from app.schemas.dataset import ColumnMapping
from app.schemas.report import AssistantQuestionRequest

SAMPLE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "sample_data"))
CLEAN_CSV_PATH = os.path.join(SAMPLE_DIR, "telco_customer_churn.csv")

def test_ai_assistant_deterministic_fallback(db_session, clean_workspace):
    """Test AI assistant answers accurately using verified MySQL data when LLM key is absent."""
    # 1. Setup data and model
    with open(CLEAN_CSV_PATH, "rb") as f:
        content = f.read()

    mapping = ColumnMapping()
    import_service = CSVImportService(db_session)
    import_service.execute_import(
        workspace_id=clean_workspace.id,
        dataset_name="AI Test Dataset",
        filename="telco_customer_churn.csv",
        content_bytes=content,
        mapping=mapping
    )

    pipeline_service = ChurnModelPipeline(db_session)
    pipeline_service.train_model(workspace_id=clean_workspace.id, algorithm="random_forest")

    # 2. Query assistant for highest churn segment
    assistant = RetainIQAnalystAssistant(db_session)
    q1 = AssistantQuestionRequest(question="Which customer segment has the highest observed churn rate?")
    ans1 = assistant.answer_question(q1, clean_workspace.id)

    assert ans1.source_type == "verified_backend_analytics"
    assert "Highest Churn Segment" in ans1.answer
    assert "%" in ans1.answer
    assert ans1.verified_data["verified_overview"]["total_customers"] == 1000
    assert len(ans1.related_links) > 0
    assert len(ans1.limitations) > 0

    # 3. Query assistant for model evaluation
    q2 = AssistantQuestionRequest(question="Explain the latest model evaluation metrics.")
    ans2 = assistant.answer_question(q2, clean_workspace.id)

    assert "Latest Model Evaluation" in ans2.answer
    assert "F1 Score" in ans2.answer
    assert "Confusion Matrix" in ans2.answer
    assert "ROC-AUC" in ans2.answer

    # 4. Query assistant for factors
    q3 = AssistantQuestionRequest(question="What factors are associated with churn in this dataset?")
    ans3 = assistant.answer_question(q3, clean_workspace.id)

    assert "Key Attributes Associated with Churn" in ans3.answer
    assert "not necessarily the root cause" in ans3.answer
