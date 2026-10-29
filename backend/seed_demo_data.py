import os
import sys

# Ensure backend root is on python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.entities import (
    User, Workspace, Customer, RetentionScenario,
    Campaign, CampaignOutcome, Investigation, InvestigationFinding, Report
)
from app.services.import_service import CSVImportService
from app.services.churn_model.pipeline import ChurnModelPipeline
from app.services.decision_lab.simulator import RetentionDecisionSimulator
from app.services.analytics.sql_analytics import SQLAnalyticsService
from app.schemas.dataset import ColumnMapping
from app.schemas.decision_lab import ScenarioCreateRequest

SAMPLE_CSV = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "sample_data", "telco_customer_churn.csv"))

def seed():
    db = SessionLocal()
    try:
        print("Connecting to MySQL retainiq_db...")
        # 1. User & Workspace
        user = db.query(User).filter(User.email == "demo@retainiq.io").first()
        if not user:
            user = User(
                email="demo@retainiq.io",
                hashed_password=get_password_hash("RetainIQ2026!"),
                full_name="Alex Mercer (Lead Retention Analyst)",
                role="admin",
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        workspace = db.query(Workspace).filter(Workspace.owner_id == user.id).first()
        if not workspace:
            workspace = Workspace(
                name="Telecom Enterprise Demo",
                slug="telecom-enterprise-demo",
                description="Live demonstration workspace with 1,000 benchmark customer records, trained ML models, and Decision Lab simulations.",
                owner_id=user.id,
                is_demo=True
            )
            db.add(workspace)
            db.commit()
            db.refresh(workspace)

        # 2. Check if customers already imported
        cust_count = db.query(Customer).filter(Customer.workspace_id == workspace.id).count()
        if cust_count == 0 and os.path.exists(SAMPLE_CSV):
            print(f"Importing benchmark dataset into workspace {workspace.name}...")
            with open(SAMPLE_CSV, "rb") as f:
                content = f.read()
            import_svc = CSVImportService(db)
            dataset, job, q_report = import_svc.execute_import(
                workspace_id=workspace.id,
                dataset_name="IBM Telco Customer Churn (Benchmark)",
                filename="telco_customer_churn.csv",
                content_bytes=content,
                mapping=ColumnMapping(),
                user_id=user.id
            )
            print(f"Imported {dataset.row_count} records. Quality Score: {q_report.quality_score}/100.")

        # 3. Train initial ML Model if none exists
        ml_pipeline = ChurnModelPipeline(db)
        model = db.query(ChurnModelPipeline).first() if False else None
        existing_models = ml_pipeline.db.query(Customer).filter(Customer.workspace_id == workspace.id).count()
        if existing_models > 50 and not workspace.model_versions:
            print("Training initial Random Forest churn model...")
            model = ml_pipeline.train_model(workspace.id, algorithm="random_forest")
            print(f"Trained model {model.version_code} with ROC-AUC {model.evaluation_metrics.get('roc_auc')}.")

        # 4. Create sample Decision Lab scenarios if none exist
        scenario_count = db.query(RetentionScenario).filter(RetentionScenario.workspace_id == workspace.id).count()
        if scenario_count == 0:
            print("Creating sample Decision Lab scenarios...")
            sim = RetentionDecisionSimulator(db)
            req_a = ScenarioCreateRequest(
                name="Strategy A: 20% Discount for High-Risk Accounts",
                description="Offer $20/month bill credit to customers with high predicted churn risk.",
                strategy_type="discount_offer",
                target_segment="High-Risk Fiber Optic Customers",
                eligible_customer_count=350,
                campaign_budget=5000.0,
                contact_cost_per_customer=2.50,
                discount_amount_per_customer=20.0,
                assumed_response_rate=0.45,
                assumed_retention_uplift=0.18,
                revenue_per_retained_customer=300.0,
                evaluation_period_months=3
            )
            sim.create_and_save_scenario(workspace.id, req_a, user.id)

            req_b = ScenarioCreateRequest(
                name="Strategy B: Proactive Concierge Tech Support",
                description="Personal outreach by senior technicians to resolve WiFi and streaming complaints.",
                strategy_type="proactive_outreach",
                target_segment="Declining Engagement + Support Tickets",
                eligible_customer_count=200,
                campaign_budget=4000.0,
                contact_cost_per_customer=15.0,
                discount_amount_per_customer=0.0,
                assumed_response_rate=0.65,
                assumed_retention_uplift=0.22,
                revenue_per_retained_customer=350.0,
                evaluation_period_months=3
            )
            sim.create_and_save_scenario(workspace.id, req_b, user.id)
            print("Created sample Decision Lab strategies A and B.")

        # 5. Create sample Investigations if none exist
        inv_count = db.query(Investigation).filter(Investigation.workspace_id == workspace.id).count()
        if inv_count == 0:
            print("Creating sample Churn Investigations...")
            inv = Investigation(
                workspace_id=workspace.id,
                title="Investigation: Fiber Optic & Month-to-Month Churn Spikes",
                description="Cross-functional inquiry into why month-to-month fiber optic customers exhibit an observed 67% churn rate in the first 12 months.",
                target_segment="Month-to-month + Fiber Optic",
                status="in_progress",
                created_by=user.id
            )
            db.add(inv)
            db.commit()
            db.refresh(inv)

            finding1 = InvestigationFinding(
                investigation_id=inv.id,
                finding_type="metric_anomaly",
                title="Early Departure Cliff at 3-6 Months",
                summary="MySQL cohort analytics confirm churn is concentrated in early tenure (median 9 months for churners vs 38 months for active customers).",
                confidence_level="high",
                data_evidence={"median_churner_tenure": 9, "median_retained_tenure": 38, "sample_size": 1000}
            )
            finding2 = InvestigationFinding(
                investigation_id=inv.id,
                finding_type="behavioral_pattern",
                title="Lack of Online Security & Tech Support Add-ons",
                summary="Customers without TechSupport or OnlineSecurity churn at 2.4x the rate of customers with bundled services, indicating onboarding friction.",
                confidence_level="high",
                data_evidence={"unbundled_churn_rate": 0.58, "bundled_churn_rate": 0.24}
            )
            db.add_all([finding1, finding2])
            db.commit()
            print("Created sample Investigation with 2 findings.")

        # 6. Create sample Campaigns and Outcomes if none exist
        camp_count = db.query(Campaign).filter(Campaign.workspace_id == workspace.id).count()
        if camp_count == 0:
            print("Creating sample Campaigns and Outcomes...")
            scenarios = db.query(RetentionScenario).filter(RetentionScenario.workspace_id == workspace.id).all()
            scen_a_id = scenarios[0].id if scenarios else None
            scen_b_id = scenarios[1].id if len(scenarios) > 1 else None

            camp1 = Campaign(
                workspace_id=workspace.id,
                scenario_id=scen_a_id,
                name="Q1 Fiber Optic Retention Pilot",
                status="completed",
                budget=5000.0
            )
            db.add(camp1)
            db.commit()
            db.refresh(camp1)

            outcome1 = CampaignOutcome(
                campaign_id=camp1.id,
                actual_contacts=320,
                actual_spend=4450.0,
                observed_retentions=58,
                observed_retention_rate=18.13,
                observed_roi=124.5,
                notes="Pilot exceeded base case uplift (+18.1% vs 18.0% baseline). Strong engagement with bill credit offers."
            )
            db.add(outcome1)

            camp2 = Campaign(
                workspace_id=workspace.id,
                scenario_id=scen_b_id,
                name="Proactive VIP Tech Outreach",
                status="active",
                budget=4000.0
            )
            db.add(camp2)
            db.commit()
            print("Created sample Campaigns with recorded outcome.")

        # 7. Create sample Executive Report if none exist
        rep_count = db.query(Report).filter(Report.workspace_id == workspace.id).count()
        if rep_count == 0:
            print("Generating initial Executive Audit Report...")
            analytics = SQLAnalyticsService(db)
            overview = analytics.get_overview_metrics(workspace.id)
            contracts = analytics.get_churn_by_contract(workspace.id)
            segments = analytics.get_segment_performances(workspace.id)

            content = {
                "executive_summary": (
                    f"RetainIQ retention audit conducted across {overview.total_customers} benchmark customer accounts. "
                    f"Observed historical churn rate is {overview.observed_churn_rate_pct}% ({overview.churned_customers} accounts). "
                    f"Total monthly recurring revenue is ${overview.monthly_recurring_revenue:,.2f}, with "
                    f"${overview.revenue_at_risk:,.2f} identified at elevated predicted risk."
                ),
                "kpis": overview.model_dump(),
                "contract_breakdown": [c.model_dump() for c in contracts],
                "high_risk_segments": [s.model_dump() for s in segments[:5]],
                "methodological_safeguards": [
                    "Metrics reflect verified MySQL ground truth without synthetic fabrication.",
                    "Predictions are statistical estimates; correlations do not prove causality.",
                    "Retention campaigns must be validated with randomized holdout groups."
                ]
            }
            report = Report(
                workspace_id=workspace.id,
                title="Executive Retention Intelligence & Audit Report",
                report_type="executive_summary",
                content_json=content,
                created_by=user.id
            )
            db.add(report)
            db.commit()
            print("Created sample Executive Report.")

        print("Seeding completed successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
