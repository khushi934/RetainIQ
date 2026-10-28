import os
import sys

# Ensure backend root is on python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.entities import User, Workspace, Customer, RetentionScenario
from app.services.import_service import CSVImportService
from app.services.churn_model.pipeline import ChurnModelPipeline
from app.services.decision_lab.simulator import RetentionDecisionSimulator
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

        print("Seeding completed successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
