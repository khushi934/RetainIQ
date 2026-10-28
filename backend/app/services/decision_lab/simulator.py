import logging
from datetime import datetime, timezone
from typing import Dict, List, Tuple, Any, Optional
import math
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.entities import RetentionScenario, ScenarioResult, Workspace
from app.schemas.decision_lab import (
    ScenarioCreateRequest, ScenarioResultResponse, ScenarioDetailResponse,
    ScenarioComparisonResponse, ScenarioComparisonItem, SensitivityScenario
)

logger = logging.getLogger("retainiq.decision_lab")

class RetentionDecisionSimulator:
    CALCULATION_VERSION = "v1.0"

    def __init__(self, db: Session):
        self.db = db

    def calculate_scenario(self, req: ScenarioCreateRequest) -> Tuple[Dict[str, Any], List[SensitivityScenario]]:
        """
        Pure mathematical calculation of retention scenario outcomes based on editable assumptions.
        Enforces clear separation between observational facts and user assumptions.
        """
        eligible = req.eligible_customer_count
        budget = req.campaign_budget
        contact_cost = req.contact_cost_per_customer
        discount = req.discount_amount_per_customer
        response_rate = req.assumed_response_rate
        uplift = req.assumed_retention_uplift
        revenue_per_customer = req.revenue_per_retained_customer
        capacity = req.campaign_capacity

        # Step 1: Calculate targeted customers respecting capacity and budget
        cost_per_target_contact = contact_cost + (response_rate * discount)
        
        # Max customers reachable by budget if budget > 0 and cost per target > 0
        if budget > 0 and cost_per_target_contact > 0:
            budget_max = int(budget // cost_per_target_contact)
            targeted = min(eligible, budget_max)
        else:
            targeted = eligible

        if capacity is not None and capacity > 0:
            targeted = min(targeted, capacity)

        # Step 2: Campaign cost breakdown
        contact_total = targeted * contact_cost
        discount_total = targeted * response_rate * discount
        total_campaign_cost = round(contact_total + discount_total, 2)

        # Step 3: Incremental retained customers under stated uplift assumption
        # Expected incremental retained = targeted * response_rate * uplift
        incremental_retained = round(targeted * response_rate * uplift, 2)

        # Step 4: Expected incremental revenue
        incremental_revenue = round(incremental_retained * revenue_per_customer, 2)

        # Step 5: Expected net financial benefit
        net_benefit = round(incremental_revenue - total_campaign_cost, 2)

        # Step 6: Cost per incremental customer retained
        cost_per_retained = round(total_campaign_cost / incremental_retained, 2) if incremental_retained > 0 else None

        # Step 7: Break-even retention uplift
        # Uplift needed for incremental revenue to equal total campaign cost
        potential_max_revenue = targeted * response_rate * revenue_per_customer
        if potential_max_revenue > 0:
            breakeven_uplift = round(total_campaign_cost / potential_max_revenue, 4)
        else:
            breakeven_uplift = None

        roi_pct = round((net_benefit / total_campaign_cost * 100), 2) if total_campaign_cost > 0 else 0.0

        # Step 8: Sensitivity Analysis across Downside (-25%), Base, and Upside (+25%)
        sensitivity_cases = []
        variations = [
            ("Conservative / Downside (-25% uplift)", max(0.0, uplift * 0.75)),
            ("Base Case (Assumed)", uplift),
            ("Optimistic / Upside (+25% uplift)", min(1.0, uplift * 1.25))
        ]

        for label, var_uplift in variations:
            var_retained = round(targeted * response_rate * var_uplift, 2)
            var_rev = round(var_retained * revenue_per_customer, 2)
            var_net = round(var_rev - total_campaign_cost, 2)
            var_roi = round((var_net / total_campaign_cost * 100), 2) if total_campaign_cost > 0 else 0.0
            sensitivity_cases.append(SensitivityScenario(
                case_name=label,
                uplift=round(var_uplift, 4),
                incremental_retained=var_retained,
                incremental_revenue=var_rev,
                net_benefit=var_net,
                roi_pct=var_roi
            ))

        results_dict = {
            "targeted_customers": targeted,
            "total_campaign_cost": total_campaign_cost,
            "expected_incremental_retained": incremental_retained,
            "expected_incremental_revenue": incremental_revenue,
            "expected_net_benefit": net_benefit,
            "cost_per_incremental_retained": cost_per_retained,
            "break_even_retention_uplift": breakeven_uplift,
            "roi_pct": roi_pct,
            "calculation_version": self.CALCULATION_VERSION
        }
        return results_dict, sensitivity_cases

    def create_and_save_scenario(
        self,
        workspace_id: int,
        req: ScenarioCreateRequest,
        user_id: int
    ) -> RetentionScenario:
        """Calculate and persist scenario and its calculation results in MySQL."""
        results_dict, sensitivity_cases = self.calculate_scenario(req)
        now = datetime.now(timezone.utc)

        scenario = RetentionScenario(
            workspace_id=workspace_id,
            name=req.name,
            description=req.description,
            strategy_type=req.strategy_type,
            target_segment=req.target_segment,
            eligible_customer_count=req.eligible_customer_count,
            campaign_budget=req.campaign_budget,
            contact_cost_per_customer=req.contact_cost_per_customer,
            discount_amount_per_customer=req.discount_amount_per_customer,
            assumed_response_rate=req.assumed_response_rate,
            assumed_retention_uplift=req.assumed_retention_uplift,
            revenue_per_retained_customer=req.revenue_per_retained_customer,
            campaign_capacity=req.campaign_capacity,
            evaluation_period_months=req.evaluation_period_months,
            created_by=user_id,
            created_at=now,
            updated_at=now
        )
        self.db.add(scenario)
        self.db.flush()

        res_obj = ScenarioResult(
            scenario_id=scenario.id,
            targeted_customers=results_dict["targeted_customers"],
            total_campaign_cost=results_dict["total_campaign_cost"],
            expected_incremental_retained=results_dict["expected_incremental_retained"],
            expected_incremental_revenue=results_dict["expected_incremental_revenue"],
            expected_net_benefit=results_dict["expected_net_benefit"],
            cost_per_incremental_retained=results_dict["cost_per_incremental_retained"],
            break_even_retention_uplift=results_dict["break_even_retention_uplift"],
            sensitivity_analysis=[s.model_dump() for s in sensitivity_cases],
            calculation_version=self.CALCULATION_VERSION,
            calculated_at=now
        )
        self.db.add(res_obj)
        self.db.commit()
        self.db.refresh(scenario)
        return scenario

    def compare_scenarios(self, workspace_id: int, scenario_ids: List[int]) -> ScenarioComparisonResponse:
        """
        Compare multiple saved scenarios side-by-side.
        Identifies best net benefit, lowest cost per retained, and differential assumptions.
        """
        scenarios = self.db.scalars(
            select(RetentionScenario)
            .where(
                RetentionScenario.workspace_id == workspace_id,
                RetentionScenario.id.in_(scenario_ids)
            )
        ).all()

        if len(scenarios) < 2:
            raise ValueError("At least 2 scenarios from this workspace are required for comparison.")

        items: List[ScenarioComparisonItem] = []
        for s in scenarios:
            latest_res = self.db.scalar(
                select(ScenarioResult)
                .where(ScenarioResult.scenario_id == s.id)
                .order_by(ScenarioResult.id.desc())
            )
            if not latest_res:
                # Recalculate if missing
                req = ScenarioCreateRequest(
                    name=s.name,
                    description=s.description,
                    strategy_type=s.strategy_type,
                    target_segment=s.target_segment,
                    eligible_customer_count=s.eligible_customer_count,
                    campaign_budget=s.campaign_budget,
                    contact_cost_per_customer=s.contact_cost_per_customer,
                    discount_amount_per_customer=s.discount_amount_per_customer,
                    assumed_response_rate=s.assumed_response_rate,
                    assumed_retention_uplift=s.assumed_retention_uplift,
                    revenue_per_retained_customer=s.revenue_per_retained_customer,
                    campaign_capacity=s.campaign_capacity,
                    evaluation_period_months=s.evaluation_period_months
                )
                r_dict, _ = self.calculate_scenario(req)
                targeted = r_dict["targeted_customers"]
                cost = r_dict["total_campaign_cost"]
                retained = r_dict["expected_incremental_retained"]
                rev = r_dict["expected_incremental_revenue"]
                net = r_dict["expected_net_benefit"]
                cpir = r_dict["cost_per_incremental_retained"]
                be = r_dict["break_even_retention_uplift"]
                roi = r_dict["roi_pct"]
            else:
                targeted = latest_res.targeted_customers
                cost = latest_res.total_campaign_cost
                retained = latest_res.expected_incremental_retained
                rev = latest_res.expected_incremental_revenue
                net = latest_res.expected_net_benefit
                cpir = latest_res.cost_per_incremental_retained
                be = latest_res.break_even_retention_uplift
                roi = round((net / cost * 100), 2) if cost > 0 else 0.0

            budget_util = round((cost / s.campaign_budget * 100), 1) if s.campaign_budget > 0 else 100.0

            items.append(ScenarioComparisonItem(
                scenario_id=s.id,
                name=s.name,
                strategy_type=s.strategy_type,
                target_segment=s.target_segment,
                targeted_customers=targeted,
                total_campaign_cost=cost,
                expected_incremental_retained=retained,
                expected_incremental_revenue=rev,
                expected_net_benefit=net,
                cost_per_incremental_retained=cpir,
                break_even_retention_uplift=be,
                roi_pct=roi,
                budget_utilization_pct=budget_util,
                assumed_uplift=s.assumed_retention_uplift
            ))

        # Determine best scenarios
        best_net = max(items, key=lambda x: x.expected_net_benefit)
        # Lowest positive CPIR
        valid_cpir = [i for i in items if i.cost_per_incremental_retained and i.cost_per_incremental_retained > 0]
        lowest_cpir = min(valid_cpir, key=lambda x: x.cost_per_incremental_retained) if valid_cpir else best_net

        notes = [
            "All retention outcomes are simulated estimates based on stated response and uplift assumptions.",
            "Historical observational correlation does not guarantee causal retention uplift in live deployments.",
            "Conduct randomized A/B holdout testing before committing large marketing budgets."
        ]

        return ScenarioComparisonResponse(
            scenarios=items,
            best_net_benefit_scenario_id=best_net.scenario_id,
            lowest_cost_per_retained_scenario_id=lowest_cpir.scenario_id,
            methodology_notes=notes
        )
