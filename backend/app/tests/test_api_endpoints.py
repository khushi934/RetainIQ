import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import get_db

client = TestClient(app)

def test_root_and_health_endpoints():
    """Verify root discovery and MySQL health endpoint via API."""
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["platform"] == "RetainIQ"

    health = client.get("/api/health")
    assert health.status_code == 200
    data = health.json()
    assert data["status"] in ["healthy", "degraded"]
    assert data["database"]["database_engine"] == "MySQL Server"

def test_auth_flow_via_api(clean_workspace):
    """Test user registration and login endpoints."""
    reg_payload = {
        "email": "sarah.connor@cyberdyne.io",
        "password": "SecurePassword2026!",
        "full_name": "Sarah Connor",
        "workspace_name": "Resistance Retention"
    }
    res = client.post("/api/auth/register", json=reg_payload)
    assert res.status_code in [201, 400] # 201 if fresh, 400 if already exists

    login_payload = {
        "email": "sarah.connor@cyberdyne.io",
        "password": "SecurePassword2026!"
    }
    login_res = client.post("/api/auth/login", json=login_payload)
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    assert token is not None

def test_decision_lab_calculate_api():
    """Test Decision Lab instant calculation preview endpoint."""
    scenario_req = {
        "name": "API Test Scenario",
        "strategy_type": "discount_offer",
        "target_segment": "High Churn Fiber",
        "eligible_customer_count": 300,
        "campaign_budget": 3000.0,
        "contact_cost_per_customer": 2.0,
        "discount_amount_per_customer": 10.0,
        "assumed_response_rate": 0.50,
        "assumed_retention_uplift": 0.10,
        "revenue_per_retained_customer": 200.0,
        "evaluation_period_months": 3
    }
    res = client.post("/api/decision-lab/calculate", json=scenario_req)
    assert res.status_code == 200
    data = res.json()
    assert data["targeted_customers"] == 300
    assert data["total_campaign_cost"] == 2100.0 # 300*2 + 300*0.5*10 = 600 + 1500 = 2100
    assert data["expected_incremental_retained"] == 15.0 # 300 * 0.5 * 0.1 = 15
    assert data["expected_net_benefit"] == 900.0 # 15*200 - 2100 = 3000 - 2100 = 900
    assert len(data["sensitivity_analysis"]) == 3
