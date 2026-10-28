import pytest
from app.services.decision_lab.simulator import RetentionDecisionSimulator
from app.schemas.decision_lab import ScenarioCreateRequest
from app.models.entities import RetentionScenario, ScenarioResult

def test_decision_lab_mathematical_calculations(db_session):
    """Verify exact formula calculations for Decision Lab simulator."""
    simulator = RetentionDecisionSimulator(db_session)

    # Strategy A: 500 eligible customers, $5000 budget, $2 contact cost, $20 discount, 40% response, 15% uplift, $250 revenue per customer
    req = ScenarioCreateRequest(
        name="High Risk Discount Outreach",
        strategy_type="discount_offer",
        target_segment="High Risk Fiber Optic",
        eligible_customer_count=500,
        campaign_budget=5000.0,
        contact_cost_per_customer=2.0,
        discount_amount_per_customer=20.0,
        assumed_response_rate=0.40,
        assumed_retention_uplift=0.15,
        revenue_per_retained_customer=250.0,
        campaign_capacity=None,
        evaluation_period_months=3
    )

    results, sensitivity = simulator.calculate_scenario(req)

    # Step 1: cost per target = 2.0 + (0.4 * 20.0) = 10.0
    # max budget targets = 5000 / 10.0 = 500 -> targeted = 500
    assert results["targeted_customers"] == 500

    # Step 2: total cost = 500 * 2.0 + 500 * 0.40 * 20.0 = 1000 + 4000 = 5000.0
    assert results["total_campaign_cost"] == 5000.0

    # Step 3: incremental retained = 500 * 0.40 * 0.15 = 30.0
    assert results["expected_incremental_retained"] == 30.0

    # Step 4: incremental revenue = 30.0 * 250.0 = 7500.0
    assert results["expected_incremental_revenue"] == 7500.0

    # Step 5: net benefit = 7500.0 - 5000.0 = 2500.0
    assert results["expected_net_benefit"] == 2500.0

    # Step 6: CPIR = 5000.0 / 30.0 = 166.67
    assert results["cost_per_incremental_retained"] == 166.67

    # Step 7: breakeven uplift = 5000 / (500 * 0.4 * 250) = 5000 / 50000 = 0.10 (10%)
    assert results["break_even_retention_uplift"] == 0.10

    # Sensitivity: 3 cases
    assert len(sensitivity) == 3
    assert sensitivity[0].case_name.startswith("Conservative")
    assert sensitivity[1].case_name.startswith("Base Case")
    assert sensitivity[2].case_name.startswith("Optimistic")

def test_decision_lab_persistence_and_comparison(db_session, clean_workspace):
    """Verify scenario saving into MySQL, reopening, and multi-scenario comparison."""
    simulator = RetentionDecisionSimulator(db_session)
    user_id = clean_workspace.owner_id

    # Create Scenario 1: Discount Strategy
    req1 = ScenarioCreateRequest(
        name="Discount Promo Strategy",
        strategy_type="discount_offer",
        target_segment="Month-to-month contracts",
        eligible_customer_count=400,
        campaign_budget=3000.0,
        contact_cost_per_customer=1.5,
        discount_amount_per_customer=15.0,
        assumed_response_rate=0.50,
        assumed_retention_uplift=0.12,
        revenue_per_retained_customer=200.0
    )
    s1 = simulator.create_and_save_scenario(clean_workspace.id, req1, user_id)

    # Create Scenario 2: High-touch Account Call Strategy
    req2 = ScenarioCreateRequest(
        name="Dedicated Phone Outreach Strategy",
        strategy_type="proactive_outreach",
        target_segment="Declining engagement",
        eligible_customer_count=200,
        campaign_budget=3000.0,
        contact_cost_per_customer=12.0,
        discount_amount_per_customer=0.0,
        assumed_response_rate=0.70,
        assumed_retention_uplift=0.20,
        revenue_per_retained_customer=350.0
    )
    s2 = simulator.create_and_save_scenario(clean_workspace.id, req2, user_id)

    assert s1.id is not None
    assert s2.id is not None

    # Check persistence in MySQL
    stored_s1 = db_session.get(RetentionScenario, s1.id)
    assert stored_s1.name == "Discount Promo Strategy"
    assert len(stored_s1.results) == 1

    # Compare scenarios
    comparison = simulator.compare_scenarios(clean_workspace.id, [s1.id, s2.id])
    assert len(comparison.scenarios) == 2
    assert comparison.best_net_benefit_scenario_id in [s1.id, s2.id]
    assert comparison.lowest_cost_per_retained_scenario_id in [s1.id, s2.id]
    assert len(comparison.methodology_notes) == 3

def test_decision_lab_zero_uplift_edge_case(db_session):
    """Verify edge case where uplift is zero does not crash with division by zero."""
    simulator = RetentionDecisionSimulator(db_session)
    req = ScenarioCreateRequest(
        name="Zero Uplift Edge Case",
        strategy_type="custom",
        target_segment="All Customers",
        eligible_customer_count=100,
        campaign_budget=1000.0,
        contact_cost_per_customer=5.0,
        discount_amount_per_customer=0.0,
        assumed_response_rate=0.50,
        assumed_retention_uplift=0.0, # Zero uplift
        revenue_per_retained_customer=100.0
    )
    results, _ = simulator.calculate_scenario(req)
    assert results["expected_incremental_retained"] == 0.0
    assert results["expected_net_benefit"] == -500.0
    assert results["cost_per_incremental_retained"] is None
