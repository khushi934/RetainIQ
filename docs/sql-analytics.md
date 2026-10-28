# RetainIQ — SQL Analytics & Metric Definitions

This document details the core SQL queries, mathematical definitions, cohort methodologies, and data integrity safeguards implemented in RetainIQ.

---

## 1. Core Metric Definitions & Formulas

### 1.1 Observed Churn Rate vs. Predicted Churn
RetainIQ strictly separates **historical observed ground truth** from **statistical machine learning predictions**:

- **Observed Churn Rate**:
  $$\text{Observed Churn Rate (\%)} = \left(\frac{\text{Count of Customers where } \text{observed\_churn} = 1}{\text{Total Eligible Customers}}\right) \times 100$$
  *Definition*: The exact percentage of customers in the dataset whose subscription was recorded as terminated.

- **Observed Retention Rate**:
  $$\text{Observed Retention Rate (\%)} = 100.0 - \text{Observed Churn Rate (\%)} = \left(\frac{\text{Active Customers}}{\text{Total Eligible Customers}}\right) \times 100$$

- **Predicted Churn Probability**:
  $$\hat{P}(\text{Churn} \mid X) \in [0.0, 1.0]$$
  *Definition*: A probabilistic estimate output by a trained Scikit-learn classification model based on feature vector $X$. Never represented as an observed historical fact.

---

### 1.2 Financial & Revenue Metrics

- **Monthly Recurring Revenue (MRR)**:
  $$\text{MRR} = \sum_{i=1}^{N} \text{monthly\_charges}_i$$
  Calculated across all active customers in the selected workspace.

- **Average Revenue Per User (ARPU)**:
  $$\text{ARPU} = \frac{\sum \text{monthly\_charges}}{\text{Total Customers}}$$

- **Revenue at Risk**:
  Calculated as the sum of monthly charges for customers categorized in the **High Risk** model prediction tier ($\hat{P} \ge 0.60$):
  $$\text{Revenue at Risk} = \sum_{c \in \text{High Risk}} \text{monthly\_charges}_c$$

---

## 2. Parameterized MySQL SQL Queries

All analytics queries are executed using MySQL 8.0+ syntax with parameterized inputs to guarantee performance and security.

### 2.1 Workspace Overview Aggregation
```sql
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
```

### 2.2 Exact Median Tenure Calculation
Uses standard MySQL 8.0 window functions to calculate the true mathematical median without loading raw arrays into memory:
```sql
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
```

### 2.3 Churn by Contract Type & Contract Risk
```sql
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
```

### 2.4 Churn by Tenure Cohort
Segment customers into standardized lifecycle buckets:
```sql
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
```

### 2.5 Multi-Dimensional Customer Segment Clusters
Combines Contract Type and Internet Service to surface high-risk clusters:
```sql
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
```

---

## 3. Data Integrity & Safeguards
1. **Zero Silent Fallback**: Database queries always target MySQL; no SQLite emulation or silent degradation is permitted.
2. **Safe Param Passing**: All filters (`workspace_id`, `dataset_id`) are passed via named SQL parameter dictionaries.
3. **Consistent Denominators**: Cohort analysis ensures every customer is counted once and only once per cohort grouping.
