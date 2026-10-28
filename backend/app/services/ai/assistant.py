import logging
import httpx
from datetime import datetime
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.config import settings
from app.models.entities import Customer, ModelVersion, RetentionScenario, Investigation
from app.services.analytics.sql_analytics import SQLAnalyticsService
from app.schemas.report import AssistantQuestionRequest, AssistantAnswerResponse

logger = logging.getLogger("retainiq.assistant")

SYSTEM_PROMPT = """You are RetainIQ Analyst, an expert customer retention data intelligence assistant.
Your mission is to explain customer behavior, churn analytics, predictive models, and scenario simulations clearly, objectively, and accurately.

CRITICAL INSTRUCTIONS:
1. ONLY reference and discuss the verified metrics and context provided to you in the prompt.
2. NEVER invent, hallucinate, or assume metrics, customer records, or statistics not in the verified data.
3. CLEARLY DISTINGUISH:
   - Observed historical facts (historical churn, actual revenue, tenure).
   - Machine learning model estimates (predicted churn probability, risk tier).
   - User-defined assumptions (assumed response rate, assumed retention uplift).
   - Simulated scenario outcomes (expected net benefit, break-even uplift).
4. Explicitly state that correlations in historical data do NOT prove causation.
5. Provide actionable guidance and recommend validation through randomized A/B holdouts.
6. Format your answer with clean Markdown, bold headers, and bullet points.
"""

class RetainIQAnalystAssistant:
    def __init__(self, db: Session):
        self.db = db
        self.analytics_service = SQLAnalyticsService(db)

    def assemble_verified_context(self, workspace_id: int, query: str) -> Dict[str, Any]:
        """
        Gathers ground-truth data from MySQL to ground the AI assistant.
        No LLM code execution is ever permitted.
        """
        overview = self.analytics_service.get_overview_metrics(workspace_id)
        contracts = self.analytics_service.get_churn_by_contract(workspace_id)
        segments = self.analytics_service.get_segment_performances(workspace_id)

        # Get latest active model version
        latest_model = self.db.scalar(
            select(ModelVersion)
            .where(ModelVersion.workspace_id == workspace_id, ModelVersion.is_active == True)
            .order_by(ModelVersion.id.desc())
        )

        # Get latest retention scenarios
        scenarios = self.db.scalars(
            select(RetentionScenario)
            .where(RetentionScenario.workspace_id == workspace_id)
            .order_by(RetentionScenario.id.desc())
            .limit(3)
        ).all()

        context_data = {
            "verified_overview": {
                "total_customers": overview.total_customers,
                "active_customers": overview.active_customers,
                "observed_churned_customers": overview.churned_customers,
                "observed_churn_rate_pct": overview.observed_churn_rate_pct,
                "observed_retention_rate_pct": overview.observed_retention_rate_pct,
                "avg_tenure_months": overview.avg_tenure_months,
                "monthly_recurring_revenue": overview.monthly_recurring_revenue,
                "revenue_at_risk": overview.revenue_at_risk,
                "high_risk_customers_count": overview.high_risk_customers_count
            },
            "contracts_breakdown": [
                {"contract": c.contract_type, "customers": c.total_customers, "churn_rate_pct": c.churn_rate_pct}
                for c in contracts
            ],
            "top_segments": [
                {"segment": s.segment_name, "customers": s.customer_count, "churn_rate_pct": s.churn_rate_pct, "risk_profile": s.risk_profile}
                for s in segments[:5]
            ],
            "model_metadata": {
                "version": latest_model.version_code if latest_model else "No model trained yet",
                "algorithm": latest_model.algorithm_name if latest_model else None,
                "metrics": latest_model.evaluation_metrics if latest_model else None,
                "top_features": latest_model.feature_importances if latest_model else None
            } if latest_model else None,
            "recent_scenarios": [
                {
                    "name": s.name,
                    "target_segment": s.target_segment,
                    "budget": s.campaign_budget,
                    "assumed_uplift": s.assumed_retention_uplift,
                    "assumed_response_rate": s.assumed_response_rate
                }
                for s in scenarios
            ]
        }
        return context_data

    def answer_question(self, req: AssistantQuestionRequest, workspace_id: int) -> AssistantAnswerResponse:
        """
        Answer user query using either configured LLM API (grounded)
        or deterministic rule-based explainer fallback.
        """
        verified_context = self.assemble_verified_context(workspace_id, req.question)
        query = req.question.strip()
        q_lower = query.lower()

        # Related links to navigate UI
        links = [
            {"label": "Overview Dashboard", "url": "/app/dashboard"},
            {"label": "Customer Segmentation", "url": "/app/segments"},
            {"label": "Retention Decision Lab", "url": "/app/decision-lab"}
        ]

        limitations = [
            "All figures reflect verified MySQL database records and documented models in this workspace.",
            "Historical correlation does not establish causal efficacy for future retention campaigns.",
            "Simulated net benefit depends strictly on user-configured response rate and uplift assumptions."
        ]

        suggested_actions = [
            "Inspect high-risk customer profiles in Customer Directory",
            "Simulate retention campaign scenarios in Decision Lab",
            "Schedule randomized A/B holdout test to validate uplift"
        ]

        # Check if LLM API key is present
        if settings.LLM_API_KEY and settings.LLM_API_KEY.strip():
            try:
                answer = self._call_llm_api(query, verified_context)
                return AssistantAnswerResponse(
                    question=query,
                    answer=answer,
                    verified_data=verified_context,
                    limitations=limitations,
                    suggested_actions=suggested_actions,
                    related_links=links,
                    source_type="llm_grounded_response"
                )
            except Exception as e:
                logger.warning(f"LLM API call failed ({e}). Falling back to deterministic analysis.")

        # Deterministic Analysis Fallback (Zero hallucinations)
        deterministic_answer = self._generate_deterministic_explanation(query, verified_context)
        return AssistantAnswerResponse(
            question=query,
            answer=deterministic_answer,
            verified_data=verified_context,
            limitations=limitations,
            suggested_actions=suggested_actions,
            related_links=links,
            source_type="verified_backend_analytics"
        )

    def _call_llm_api(self, query: str, context: Dict[str, Any]) -> str:
        """Make grounded POST request to configured LLM endpoint."""
        prompt_content = f"""Verified Database Context:
{context}

User Question:
{query}
"""
        headers = {
            "Authorization": f"Bearer {settings.LLM_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": settings.LLM_MODEL,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt_content}
            ],
            "temperature": 0.2,
            "max_tokens": 800
        }

        with httpx.Client(timeout=25.0) as client:
            resp = client.post(
                f"{settings.LLM_BASE_URL.rstrip('/')}/chat/completions",
                headers=headers,
                json=payload
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]

    def _generate_deterministic_explanation(self, query: str, context: Dict[str, Any]) -> str:
        """
        High-precision deterministic analysis based purely on verified SQL records.
        Executed when no LLM key is set or when provider fails.
        """
        q = query.lower()
        overview = context["verified_overview"]
        segments = context.get("top_segments", [])
        contracts = context.get("contracts_breakdown", [])
        model = context.get("model_metadata")

        # 1. Segment questions
        if "highest" in q or "segment" in q or "who is leaving" in q:
            if segments:
                top_seg = segments[0]
                return (
                    f"### Verified Customer Segment Analysis\n\n"
                    f"Based on real MySQL database calculations across **{overview['total_customers']} customers**:\n\n"
                    f"- **Highest Churn Segment**: **{top_seg['segment']}** with an observed churn rate of **{top_seg['churn_rate_pct']}%** ({top_seg['customers']} customers).\n"
                    f"- **Overall Observed Churn Rate**: **{overview['observed_churn_rate_pct']}%**.\n\n"
                    f"#### Breakdown by Contract Type:\n"
                    + "\n".join([f"- **{c['contract']}**: {c['churn_rate_pct']}% observed churn ({c['customers']} accounts)" for c in contracts])
                    + "\n\n*Note: Observational correlation does not prove contract type causes churn. Consider investigating customer tenure and service satisfaction.*"
                )

        # 2. Model evaluation questions
        if "model" in q or "accuracy" in q or "evaluation" in q or "precision" in q or "f1" in q:
            if model and model.get("metrics"):
                m = model["metrics"]
                cm = m.get("confusion_matrix", {})
                return (
                    f"### Latest Model Evaluation ({model['version']})\n\n"
                    f"- **Algorithm**: {model['algorithm']}\n"
                    f"- **F1 Score**: **{m.get('f1_score', 'N/A')}**\n"
                    f"- **Precision**: **{m.get('precision', 'N/A')}** (proportion of predicted churners who actually churned)\n"
                    f"- **Recall**: **{m.get('recall', 'N/A')}** (proportion of actual churners identified by model)\n"
                    f"- **ROC-AUC**: **{m.get('roc_auc', 'N/A')}**\n"
                    f"- **Baseline Churn Rate**: {round(m.get('baseline_churn_rate', 0.0) * 100, 1)}%\n\n"
                    f"#### Test Set Confusion Matrix ({sum(cm.values())} test samples):\n"
                    f"- **True Negatives**: {cm.get('true_negatives')}\n"
                    f"- **False Positives**: {cm.get('false_positives')}\n"
                    f"- **False Negatives**: {cm.get('false_negatives')}\n"
                    f"- **True Positives**: {cm.get('true_positives')}\n\n"
                    f"*Methodology: {m.get('methodology', 'Stratified train/test split')}*"
                )
            else:
                return "No predictive model has been trained yet in this workspace. Please navigate to the **Model Workspace** to train and evaluate a model."

        # 3. Factor / Feature questions
        if "factor" in q or "driver" in q or "feature" in q or "why" in q:
            if model and model.get("top_features"):
                feats = model["top_features"]
                bullet_feats = "\n".join([f"- **{k}**: relative importance score **{v}**" for k, v in list(feats.items())[:6]])
                return (
                    f"### Key Attributes Associated with Churn\n\n"
                    f"The machine learning model ({model['version']}) identified the following top predictive features:\n\n"
                    f"{bullet_feats}\n\n"
                    f"> **Scientific Caution**: A feature associated with a churn prediction is a statistical correlate and **not necessarily the root cause**. "
                    f"For instance, month-to-month contracts may attract customers who already had low initial commitment."
                )

        # 4. Overview summary
        return (
            f"### Workspace Retention Intelligence Summary\n\n"
            f"- **Total Customer Base**: **{overview['total_customers']}**\n"
            f"- **Observed Churn Rate**: **{overview['observed_churn_rate_pct']}%** ({overview['observed_churned_customers']} churned)\n"
            f"- **Observed Retention Rate**: **{overview['observed_retention_rate_pct']}%**\n"
            f"- **Monthly Recurring Revenue (MRR)**: **${overview['monthly_recurring_revenue']:,.2f}**\n"
            f"- **Estimated Monthly Revenue at Risk**: **${overview['revenue_at_risk']:,.2f}** ({overview['high_risk_customers_count']} high-risk customers)\n"
            f"- **Average Customer Tenure**: **{overview['avg_tenure_months']} months**\n\n"
            f"To explore specific hypotheses, ask about **segment comparisons**, **model evaluation**, or run what-if simulations in the **Retention Decision Lab**."
        )
