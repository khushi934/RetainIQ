import logging
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text, func, select

from app.models.entities import Customer, Prediction, ModelVersion
from app.schemas.analytics import (
    OverviewMetrics, ChurnByContract, ChurnByInternet, ChurnByTenureCohort,
    ChurnTrendPoint, RiskTierDistribution, SegmentPerformance
)

logger = logging.getLogger("retainiq.analytics")

class SQLAnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    def get_overview_metrics(self, workspace_id: int) -> OverviewMetrics:
        """
        Execute parameterized MySQL aggregate queries to calculate core business KPIs.
        Distinguishes observed historical facts from model predictions.
        """
        # SQL Query 1: Total counts, churn status, tenure aggregates, and revenue
        sql = text("""
            SELECT 
                COUNT(*) AS total_customers,
                SUM(CASE WHEN observed_churn = 1 THEN 1 ELSE 0 END) AS churned_customers,
                SUM(CASE WHEN observed_churn = 0 THEN 1 ELSE 0 END) AS active_customers,
                COALESCE(AVG(tenure_months), 0.0) AS avg_tenure,
                COALESCE(SUM(monthly_charges), 0.0) AS total_mrr,
                COALESCE(AVG(monthly_charges), 0.0) AS avg_monthly_charge,
                COALESCE(SUM(CASE WHEN observed_churn = 1 THEN monthly_charges ELSE 0 END), 0.0) AS churned_mrr
            FROM customers
            WHERE workspace_id = :ws_id;
        """)
        row = self.db.execute(sql, {"ws_id": workspace_id}).mappings().first()

        total = int(row["total_customers"]) if row and row["total_customers"] else 0
        churned = int(row["churned_customers"]) if row and row["churned_customers"] else 0
        active = int(row["active_customers"]) if row and row["active_customers"] else 0
        avg_tenure = round(float(row["avg_tenure"]), 1) if row and row["avg_tenure"] else 0.0
        mrr = round(float(row["total_mrr"]), 2) if row and row["total_mrr"] else 0.0
        arpu = round(float(row["avg_monthly_charge"]), 2) if row and row["avg_monthly_charge"] else 0.0
        
        churn_rate = round((churned / total * 100), 2) if total > 0 else 0.0
        retention_rate = round(100.0 - churn_rate, 2) if total > 0 else 0.0

        # SQL Query 2: Median tenure calculation via MySQL window function
        median_sql = text("""
            WITH RankedTenure AS (
                SELECT 
                    tenure_months,
                    ROW_NUMBER() OVER (ORDER BY tenure_months) AS row_num,
                    COUNT(*) OVER () AS total_rows
                FROM customers
                WHERE workspace_id = :ws_id
            )
            SELECT COALESCE(AVG(tenure_months), 0.0) AS median_tenure
            FROM RankedTenure
            WHERE row_num IN (FLOOR((total_rows + 1) / 2), CEIL((total_rows + 1) / 2));
        """)
        med_row = self.db.execute(median_sql, {"ws_id": workspace_id}).mappings().first()
        median_tenure = round(float(med_row["median_tenure"]), 1) if med_row and med_row["median_tenure"] else 0.0

        # SQL Query 3: Machine learning prediction risk summary (if predictions exist)
        risk_sql = text("""
            SELECT 
                COUNT(*) AS high_risk_count,
                COALESCE(SUM(c.monthly_charges), 0.0) AS high_risk_revenue,
                COALESCE(AVG(p.predicted_churn_probability), 0.0) AS avg_predicted_prob
            FROM predictions p
            JOIN (
                SELECT customer_id, MAX(id) AS latest_pred_id
                FROM predictions
                WHERE workspace_id = :ws_id
                GROUP BY customer_id
            ) lp ON p.id = lp.latest_pred_id
            JOIN customers c ON p.customer_id = c.id
            WHERE p.risk_tier = 'High';
        """)
        risk_row = self.db.execute(risk_sql, {"ws_id": workspace_id}).mappings().first()
        high_risk_count = int(risk_row["high_risk_count"]) if risk_row and risk_row["high_risk_count"] else 0
        revenue_at_risk = round(float(risk_row["high_risk_revenue"]), 2) if risk_row and risk_row["high_risk_revenue"] else round(churned * arpu, 2)
        avg_pred_prob = round(float(risk_row["avg_predicted_prob"]) * 100, 2) if risk_row and risk_row["avg_predicted_prob"] else None

        return OverviewMetrics(
            total_customers=total,
            active_customers=active,
            churned_customers=churned,
            observed_churn_rate_pct=churn_rate,
            observed_retention_rate_pct=retention_rate,
            avg_tenure_months=avg_tenure,
            median_tenure_months=median_tenure,
            monthly_recurring_revenue=mrr,
            avg_revenue_per_customer=arpu,
            revenue_at_risk=revenue_at_risk,
            high_risk_customers_count=high_risk_count,
            predicted_churn_rate_pct=avg_pred_prob
        )

    def get_churn_by_contract(self, workspace_id: int) -> List[ChurnByContract]:
        """SQL query for contract breakdown and observed churn rates."""
        sql = text("""
            SELECT 
                COALESCE(contract_type, 'Unknown') AS contract_type,
                COUNT(*) AS total_customers,
                SUM(CASE WHEN observed_churn = 1 THEN 1 ELSE 0 END) AS churned_customers,
                ROUND(SUM(CASE WHEN observed_churn = 1 THEN 1.0 ELSE 0.0 END) / COUNT(*) * 100, 2) AS churn_rate_pct,
                COALESCE(SUM(monthly_charges), 0.0) AS mrr
            FROM customers
            WHERE workspace_id = :ws_id
            GROUP BY contract_type
            ORDER BY total_customers DESC;
        """)
        rows = self.db.execute(sql, {"ws_id": workspace_id}).mappings().all()
        return [
            ChurnByContract(
                contract_type=r["contract_type"],
                total_customers=int(r["total_customers"]),
                churned_customers=int(r["churned_customers"]),
                churn_rate_pct=float(r["churn_rate_pct"]),
                mrr=round(float(r["mrr"]), 2)
            )
            for r in rows
        ]

    def get_churn_by_internet(self, workspace_id: int) -> List[ChurnByInternet]:
        """SQL query for internet service breakdown and observed churn rates."""
        sql = text("""
            SELECT 
                COALESCE(internet_service, 'None') AS internet_service,
                COUNT(*) AS total_customers,
                SUM(CASE WHEN observed_churn = 1 THEN 1 ELSE 0 END) AS churned_customers,
                ROUND(SUM(CASE WHEN observed_churn = 1 THEN 1.0 ELSE 0.0 END) / COUNT(*) * 100, 2) AS churn_rate_pct
            FROM customers
            WHERE workspace_id = :ws_id
            GROUP BY internet_service
            ORDER BY total_customers DESC;
        """)
        rows = self.db.execute(sql, {"ws_id": workspace_id}).mappings().all()
        return [
            ChurnByInternet(
                internet_service=r["internet_service"],
                total_customers=int(r["total_customers"]),
                churned_customers=int(r["churned_customers"]),
                churn_rate_pct=float(r["churn_rate_pct"])
            )
            for r in rows
        ]

    def get_churn_by_tenure_cohorts(self, workspace_id: int) -> List[ChurnByTenureCohort]:
        """SQL query aggregating customer churn across tenure buckets."""
        sql = text("""
            SELECT 
                CASE 
                    WHEN tenure_months <= 6 THEN '0-6 months'
                    WHEN tenure_months <= 12 THEN '7-12 months'
                    WHEN tenure_months <= 24 THEN '13-24 months'
                    WHEN tenure_months <= 48 THEN '25-48 months'
                    ELSE '49+ months'
                END AS cohort_range,
                COUNT(*) AS total_customers,
                SUM(CASE WHEN observed_churn = 1 THEN 1 ELSE 0 END) AS churned_customers,
                ROUND(SUM(CASE WHEN observed_churn = 1 THEN 1.0 ELSE 0.0 END) / COUNT(*) * 100, 2) AS churn_rate_pct,
                MIN(tenure_months) AS sort_order
            FROM customers
            WHERE workspace_id = :ws_id
            GROUP BY cohort_range
            ORDER BY sort_order ASC;
        """)
        rows = self.db.execute(sql, {"ws_id": workspace_id}).mappings().all()
        return [
            ChurnByTenureCohort(
                cohort_range=r["cohort_range"],
                total_customers=int(r["total_customers"]),
                churned_customers=int(r["churned_customers"]),
                churn_rate_pct=float(r["churn_rate_pct"])
            )
            for r in rows
        ]

    def get_churn_trends_over_time(self, workspace_id: int) -> List[ChurnTrendPoint]:
        """
        SQL query aggregating churn trends by month from customer last activity dates.
        """
        sql = text("""
            SELECT 
                DATE_FORMAT(last_activity_date, '%Y-%m') AS period,
                COUNT(*) AS total_recorded,
                SUM(CASE WHEN observed_churn = 1 THEN 1 ELSE 0 END) AS churned_count,
                SUM(CASE WHEN observed_churn = 0 THEN 1 ELSE 0 END) AS active_count,
                ROUND(SUM(CASE WHEN observed_churn = 1 THEN 1.0 ELSE 0.0 END) / COUNT(*) * 100, 2) AS churn_rate_pct
            FROM customers
            WHERE workspace_id = :ws_id AND last_activity_date IS NOT NULL
            GROUP BY period
            ORDER BY period ASC;
        """)
        rows = self.db.execute(sql, {"ws_id": workspace_id}).mappings().all()
        return [
            ChurnTrendPoint(
                period=r["period"] or "Current",
                new_customers=int(r["total_recorded"]),
                churned_customers=int(r["churned_count"]),
                active_customers=int(r["active_count"]),
                churn_rate_pct=float(r["churn_rate_pct"])
            )
            for r in rows
        ]

    def get_risk_tier_distribution(self, workspace_id: int) -> List[RiskTierDistribution]:
        """SQL query for customer distribution across predicted risk tiers."""
        sql = text("""
            SELECT 
                COALESCE(p.risk_tier, 'Unscored') AS risk_tier,
                COUNT(c.id) AS customer_count,
                COALESCE(SUM(c.monthly_charges), 0.0) AS revenue_sum
            FROM customers c
            LEFT JOIN (
                SELECT p1.customer_id, p1.risk_tier
                FROM predictions p1
                JOIN (
                    SELECT customer_id, MAX(id) AS max_id 
                    FROM predictions 
                    WHERE workspace_id = :ws_id 
                    GROUP BY customer_id
                ) latest ON p1.id = latest.max_id
            ) p ON c.id = p.customer_id
            WHERE c.workspace_id = :ws_id
            GROUP BY risk_tier
            ORDER BY customer_count DESC;
        """)
        rows = self.db.execute(sql, {"ws_id": workspace_id}).mappings().all()
        total_customers = sum(r["customer_count"] for r in rows) if rows else 0
        return [
            RiskTierDistribution(
                risk_tier=r["risk_tier"],
                customer_count=int(r["customer_count"]),
                percentage=round((r["customer_count"] / total_customers * 100), 2) if total_customers > 0 else 0.0,
                revenue_sum=round(float(r["revenue_sum"]), 2)
            )
            for r in rows
        ]

    def get_segment_performances(self, workspace_id: int) -> List[SegmentPerformance]:
        """
        Calculates multi-dimensional customer segments combining Contract and Internet service.
        Identifies high-churn risk clusters directly in MySQL.
        """
        sql = text("""
            SELECT 
                CONCAT(COALESCE(contract_type, 'Month-to-month'), ' + ', COALESCE(internet_service, 'No Internet')) AS segment_name,
                COUNT(*) AS customer_count,
                SUM(CASE WHEN observed_churn = 1 THEN 1 ELSE 0 END) AS churned_count,
                ROUND(SUM(CASE WHEN observed_churn = 1 THEN 1.0 ELSE 0.0 END) / COUNT(*) * 100, 2) AS churn_rate_pct,
                ROUND(AVG(monthly_charges), 2) AS avg_monthly_charges,
                ROUND(SUM(monthly_charges), 2) AS total_revenue
            FROM customers
            WHERE workspace_id = :ws_id
            GROUP BY segment_name
            HAVING customer_count >= 5
            ORDER BY churn_rate_pct DESC;
        """)
        rows = self.db.execute(sql, {"ws_id": workspace_id}).mappings().all()
        results = []
        for r in rows:
            rate = float(r["churn_rate_pct"])
            if rate >= 40.0:
                profile = "Critical Risk"
            elif rate >= 25.0:
                profile = "Elevated Risk"
            elif rate >= 15.0:
                profile = "Moderate"
            else:
                profile = "Low Risk"
                
            results.append(SegmentPerformance(
                segment_name=r["segment_name"],
                customer_count=int(r["customer_count"]),
                churned_count=int(r["churned_count"]),
                churn_rate_pct=rate,
                avg_monthly_charges=float(r["avg_monthly_charges"]),
                total_revenue=float(r["total_revenue"]),
                risk_profile=profile
            ))
        return results
