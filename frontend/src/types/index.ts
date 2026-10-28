export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  workspaces: WorkspaceSummary[];
  created_at: string;
}

export interface WorkspaceSummary {
  id: number;
  name: string;
  slug: string;
  is_demo: boolean;
  created_at: string;
}

export interface Customer {
  id: number;
  workspace_id: number;
  dataset_id?: number;
  customer_identifier: string;
  gender?: string;
  senior_citizen: boolean;
  partner?: string;
  dependents?: string;
  tenure_months: number;
  phone_service?: string;
  multiple_lines?: string;
  internet_service?: string;
  online_security?: string;
  online_backup?: string;
  device_protection?: string;
  tech_support?: string;
  streaming_tv?: string;
  streaming_movies?: string;
  contract_type?: string;
  paperless_billing?: string;
  payment_method?: string;
  monthly_charges: number;
  total_charges: number;
  subscription_status: string;
  last_activity_date?: string;
  engagement_score?: number;
  observed_churn: boolean;
  latest_predicted_churn_probability?: number;
  latest_risk_tier?: 'Low' | 'Medium' | 'High';
  top_contributing_factors?: Array<{ factor: string; impact: string }>;
}

export interface CustomerListResponse {
  items: Customer[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface OverviewMetrics {
  total_customers: number;
  active_customers: number;
  churned_customers: number;
  observed_churn_rate_pct: number;
  observed_retention_rate_pct: number;
  avg_tenure_months: number;
  median_tenure_months: number;
  monthly_recurring_revenue: number;
  avg_revenue_per_customer: number;
  revenue_at_risk: number;
  high_risk_customers_count: number;
  predicted_churn_rate_pct?: number;
}

export interface ChurnByContract {
  contract_type: string;
  total_customers: number;
  churned_customers: number;
  churn_rate_pct: number;
  mrr: number;
}

export interface ChurnByInternet {
  internet_service: string;
  total_customers: number;
  churned_customers: number;
  churn_rate_pct: number;
}

export interface ChurnByTenureCohort {
  cohort_range: string;
  total_customers: number;
  churned_customers: number;
  churn_rate_pct: number;
}

export interface ChurnTrendPoint {
  period: string;
  new_customers: number;
  churned_customers: number;
  active_customers: number;
  churn_rate_pct: number;
}

export interface RiskTierDistribution {
  risk_tier: string;
  customer_count: number;
  percentage: number;
  revenue_sum: number;
}

export interface SegmentPerformance {
  segment_name: string;
  customer_count: number;
  churned_count: number;
  churn_rate_pct: number;
  avg_monthly_charges: number;
  total_revenue: number;
  risk_profile: string;
}

export interface EvaluationMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  baseline_churn_rate: number;
  confusion_matrix: {
    true_negatives: number;
    false_positives: number;
    false_negatives: number;
    true_positives: number;
  };
  class_distribution: {
    total_retained: number;
    total_churned: number;
  };
  methodology: string;
}

export interface ModelVersion {
  id: number;
  workspace_id: number;
  version_code: string;
  algorithm_name: string;
  target_column: string;
  target_definition: string;
  training_sample_size: number;
  test_sample_size: number;
  features_used: string[];
  evaluation_metrics: EvaluationMetrics;
  feature_importances?: Record<string, number>;
  is_active: boolean;
  created_at: string;
}

export interface SensitivityScenario {
  case_name: string;
  uplift: number;
  incremental_retained: number;
  incremental_revenue: number;
  net_benefit: number;
  roi_pct: number;
}

export interface ScenarioResult {
  id?: number;
  scenario_id?: number;
  targeted_customers: number;
  total_campaign_cost: number;
  expected_incremental_retained: number;
  expected_incremental_revenue: number;
  expected_net_benefit: number;
  cost_per_incremental_retained?: number;
  break_even_retention_uplift?: number;
  roi_pct: number;
  sensitivity_analysis: SensitivityScenario[];
  calculation_version: string;
  calculated_at: string;
}

export interface RetentionScenario {
  id: number;
  workspace_id: number;
  name: string;
  description?: string;
  strategy_type: string;
  target_segment: string;
  eligible_customer_count: number;
  campaign_budget: number;
  contact_cost_per_customer: number;
  discount_amount_per_customer: number;
  assumed_response_rate: number;
  assumed_retention_uplift: number;
  revenue_per_retained_customer: number;
  campaign_capacity?: number;
  evaluation_period_months: number;
  latest_result?: ScenarioResult;
  created_at: string;
  updated_at: string;
}

export interface ScenarioComparisonItem {
  scenario_id: number;
  name: string;
  strategy_type: string;
  target_segment: string;
  targeted_customers: number;
  total_campaign_cost: number;
  expected_incremental_retained: number;
  expected_incremental_revenue: number;
  expected_net_benefit: number;
  cost_per_incremental_retained?: number;
  break_even_retention_uplift?: number;
  roi_pct: number;
  budget_utilization_pct: number;
  assumed_uplift: number;
}

export interface ScenarioComparisonResponse {
  scenarios: ScenarioComparisonItem[];
  best_net_benefit_scenario_id: number;
  lowest_cost_per_retained_scenario_id: number;
  methodology_notes: string[];
}

export interface DataQualityReport {
  dataset_id: number;
  dataset_name: string;
  total_rows: number;
  accepted_rows: number;
  rejected_rows: number;
  missing_values_by_column: Record<string, number>;
  duplicate_identifiers_count: number;
  invalid_dates_count: number;
  invalid_numeric_count: number;
  churn_label_distribution: Record<string, number>;
  observed_churn_rate_pct: number;
  potential_target_leakage_warnings: string[];
  data_freshness_status: string;
  quality_score: number;
  beginner_explanation: string;
}

export interface InvestigationFinding {
  id: number;
  investigation_id: number;
  finding_type: string;
  title: string;
  summary: string;
  data_evidence?: any;
  confidence_level: string;
  created_at: string;
}

export interface Investigation {
  id: number;
  workspace_id: number;
  title: string;
  description?: string;
  target_segment?: string;
  status: string;
  created_by: number;
  findings: InvestigationFinding[];
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: number;
  workspace_id: number;
  scenario_id?: number;
  name: string;
  status: string;
  budget: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  outcomes: any[];
}

export interface Report {
  id: number;
  workspace_id: number;
  title: string;
  report_type: string;
  content_json: any;
  created_by: number;
  created_at: string;
}

export interface AssistantAnswer {
  question: string;
  answer: string;
  verified_data: any;
  limitations: string[];
  suggested_actions: string[];
  related_links: Array<{ label: string; url: string }>;
  source_type: string;
}
