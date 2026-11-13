import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Database,
  Brain,
  FlaskConical,
  UploadCloud,
  FileSpreadsheet
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { api } from '../services/api';
import {
  OverviewMetrics,
  ChurnByContract,
  RiskTierDistribution,
  ChurnByTenureCohort,
  Customer
} from '../types';
import { StatCard } from '../components/StatCard';
import { RiskBadge } from '../components/RiskBadge';

export const DashboardPage: React.FC = () => {
  const [overview, setOverview] = useState<OverviewMetrics | null>(null);
  const [contracts, setContracts] = useState<ChurnByContract[]>([]);
  const [riskDist, setRiskDist] = useState<RiskTierDistribution[]>([]);
  const [tenureCohorts, setTenureCohorts] = useState<ChurnByTenureCohort[]>([]);
  const [highRiskCustomers, setHighRiskCustomers] = useState<Customer[]>([]);
  const [recentDatasets, setRecentDatasets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ov, ct, rd, tc, custs, dsets] = await Promise.all([
        api.getOverview(),
        api.getContracts(),
        api.getRiskDistribution(),
        api.getTenureCohorts(),
        api.getCustomers({ page: 1, page_size: 5, risk: 'High', sort_by: 'monthly_charges', sort_order: 'desc' }),
        api.getDatasets().catch(() => [])
      ]);
      setOverview(ov);
      setContracts(ct);
      setRiskDist(rd);
      setTenureCohorts(tc);
      setHighRiskCustomers(custs.items);
      setRecentDatasets(dsets);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-28 text-[#697386]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-6 h-6 border-2 border-[#E6E8EC] border-t-[#315E81] rounded-full animate-spin"></div>
          <span className="text-[13px] font-medium">Aggregating retention analytics from MySQL...</span>
        </div>
      </div>
    );
  }

  // Format risk distribution data for chart
  const riskChartData = riskDist.map((d) => ({
    tier: d.tier,
    customers: d.customer_count,
    percentage: d.percentage
  }));

  return (
    <div className="space-y-7">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold text-[#20242C] tracking-tight">
            Overview
          </h1>
          <p className="text-[14px] text-[#697386] mt-1">
            Monitor customer retention performance and identify areas that need attention.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Link
            to="/app/import"
            className="px-3.5 py-2 bg-white border border-[#E6E8EC] hover:bg-[#F7F8FA] text-[#20242C] rounded-md text-[13px] font-medium transition-colors flex items-center space-x-1.5 shadow-card"
          >
            <UploadCloud className="w-4 h-4 text-[#697386]" />
            <span>Import Data</span>
          </Link>
          <Link
            to="/app/decision-lab"
            className="px-3.5 py-2 bg-[#315E81] hover:bg-[#274b68] text-white rounded-md text-[13px] font-medium transition-colors flex items-center space-x-1.5 shadow-card"
          >
            <FlaskConical className="w-4 h-4" />
            <span>Retention Decision Lab</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-[#FBF2F2] border border-[#F2D5D4] rounded-lg text-[13px] text-[#C75B58]">
          {error}
        </div>
      )}

      {/* KPI Cards (Section 7: 4 Clean Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Customers */}
        <StatCard
          title="Total Customers"
          value={overview?.total_customers.toLocaleString() || '0'}
          subtitle={`${overview?.active_customers || 0} active, ${overview?.churned_customers || 0} historically churned`}
          formula="COUNT(*) from customers table in active workspace"
        />

        {/* 2. Historical Churn Rate */}
        <StatCard
          title="Historical Churn Rate"
          value={`${overview?.observed_churn_rate_pct || 0}%`}
          subtitle={`Observed historical retention rate: ${overview?.observed_retention_rate_pct || 0}%`}
          formula="Observed churned customers / Total customers with known churn status * 100"
          badge={{
            text: (overview?.observed_churn_rate_pct || 0) > 25 ? 'Elevated Churn' : 'Baseline',
            variant: (overview?.observed_churn_rate_pct || 0) > 25 ? 'warning' : 'neutral'
          }}
        />

        {/* 3. Predicted High-Risk Customers */}
        <StatCard
          title="Predicted High-Risk Customers"
          value={overview?.high_risk_customers_count?.toLocaleString() || '0'}
          subtitle={`$${(overview?.revenue_at_risk || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MRR exposure`}
          formula="Customers scored by Random Forest classifier with predicted probability >= 0.60"
          badge={{
            text: (overview?.high_risk_customers_count || 0) > 0 ? 'Action Required' : 'Low Exposure',
            variant: (overview?.high_risk_customers_count || 0) > 0 ? 'negative' : 'positive'
          }}
        />

        {/* 4. Average Customer Tenure */}
        <StatCard
          title="Average Customer Tenure"
          value={`${overview?.avg_tenure_months || 0} mos`}
          subtitle={`Median customer tenure: ${overview?.median_tenure_months || 0} months`}
          formula="AVG(tenure_months) and windowed median across customer records"
        />
      </div>

      {/* Two-Column Balanced Charts (Section 7) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Historical Churn by Contract Type */}
        <div className="bg-white border border-[#E6E8EC] rounded-lg p-5">
          <div className="mb-4">
            <h2 className="text-[15px] font-semibold text-[#20242C]">
              Historical Churn by Contract Type
            </h2>
            <p className="text-[12px] text-[#697386] mt-0.5">
              Observed churn percentage across contract structures in database.
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contracts} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6E8EC" />
                <XAxis dataKey="contract_type" stroke="#697386" fontSize={12} tickLine={false} />
                <YAxis stroke="#697386" fontSize={12} tickLine={false} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#20242C', borderColor: '#20242C', color: '#FFFFFF', fontSize: '12px', borderRadius: '6px' }}
                  formatter={(val: any) => [`${val}%`, 'Observed Churn Rate']}
                />
                <Bar dataKey="churn_rate_pct" name="Churn Rate" fill="#315E81" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Customer Risk Distribution */}
        <div className="bg-white border border-[#E6E8EC] rounded-lg p-5">
          <div className="mb-4">
            <h2 className="text-[15px] font-semibold text-[#20242C]">
              Customer Risk Distribution
            </h2>
            <p className="text-[12px] text-[#697386] mt-0.5">
              Distribution of customer accounts by ML model predicted churn probability tier.
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6E8EC" />
                <XAxis dataKey="tier" stroke="#697386" fontSize={12} tickLine={false} />
                <YAxis stroke="#697386" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#20242C', borderColor: '#20242C', color: '#FFFFFF', fontSize: '12px', borderRadius: '6px' }}
                  formatter={(val: any) => [`${val} accounts`, 'Customer Count']}
                />
                <Bar dataKey="customers" name="Customers" fill="#438A83" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Lower Analytical Section: Tenure Cohorts Analysis */}
      <div className="bg-white border border-[#E6E8EC] rounded-lg p-5">
        <div className="mb-4">
          <h2 className="text-[15px] font-semibold text-[#20242C]">
            Customer Tenure Analysis
          </h2>
          <p className="text-[12px] text-[#697386] mt-0.5">
            Observed churn rates and customer volume segmented by tenure duration cohorts.
          </p>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tenureCohorts} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6E8EC" />
              <XAxis dataKey="cohort_name" stroke="#697386" fontSize={12} tickLine={false} />
              <YAxis stroke="#697386" fontSize={12} tickLine={false} unit="%" />
              <Tooltip
                contentStyle={{ backgroundColor: '#20242C', borderColor: '#20242C', color: '#FFFFFF', fontSize: '12px', borderRadius: '6px' }}
                formatter={(val: any) => [`${val}%`, 'Observed Churn Rate']}
              />
              <Bar dataKey="churn_rate_pct" name="Churn Rate" fill="#D69A37" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity: High-Risk Customers & Data Imports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Highest Predicted Risk Customers Table */}
        <div className="lg:col-span-2 bg-white border border-[#E6E8EC] rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[15px] font-semibold text-[#20242C]">
                Highest Predicted Risk Customers
              </h2>
              <p className="text-[12px] text-[#697386] mt-0.5">
                Accounts identified by the ML classifier with highest churn probability (&ge; 60%)
              </p>
            </div>
            <Link
              to="/app/customers"
              className="text-[13px] font-medium text-[#315E81] hover:underline flex items-center space-x-1"
            >
              <span>View Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto border border-[#E6E8EC] rounded-md">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="data-table-header">Customer ID</th>
                  <th className="data-table-header">Contract</th>
                  <th className="data-table-header">Tenure</th>
                  <th className="data-table-header text-right">Monthly Charges</th>
                  <th className="data-table-header">Model Risk Tier</th>
                </tr>
              </thead>
              <tbody>
                {highRiskCustomers.map((c) => (
                  <tr key={c.id} className="data-table-row">
                    <td className="data-table-cell font-mono text-[12px] text-[#315E81] font-medium">
                      <Link to={`/app/customers/${c.id}`} className="hover:underline">
                        {c.customer_identifier}
                      </Link>
                    </td>
                    <td className="data-table-cell text-[13px] text-[#20242C]">
                      {c.contract_type}
                    </td>
                    <td className="data-table-cell text-[13px] text-[#697386]">
                      {c.tenure_months} mos
                    </td>
                    <td className="data-table-cell text-[13px] text-[#20242C] font-mono text-right font-medium">
                      ${c.monthly_charges.toFixed(2)}
                    </td>
                    <td className="data-table-cell">
                      <RiskBadge
                        tier={c.latest_prediction?.risk_tier || 'High'}
                        probability={c.latest_prediction?.predicted_churn_probability}
                      />
                    </td>
                  </tr>
                ))}
                {highRiskCustomers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-[13px] text-[#697386]">
                      No high-risk customer accounts identified.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Data Ingestion History */}
        <div className="bg-white border border-[#E6E8EC] rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[15px] font-semibold text-[#20242C]">
                Data Imports
              </h2>
              <p className="text-[12px] text-[#697386] mt-0.5">
                Recently ingested customer datasets in MySQL
              </p>
            </div>
            <Link
              to="/app/import"
              className="text-[13px] font-medium text-[#315E81] hover:underline flex items-center space-x-1"
            >
              <span>Manage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentDatasets.slice(0, 4).map((ds, idx) => (
              <div
                key={ds.id || idx}
                className="p-3 bg-[#F7F8FA] border border-[#E6E8EC] rounded-md flex items-start space-x-3"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#315E81] shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium text-[#20242C] truncate">
                    {ds.name}
                  </div>
                  <div className="text-[11px] text-[#697386] mt-0.5">
                    {ds.row_count?.toLocaleString()} rows &bull; {ds.status || 'imported'}
                  </div>
                </div>
              </div>
            ))}
            {recentDatasets.length === 0 && (
              <div className="p-6 text-center text-[12px] text-[#697386]">
                No recent dataset uploads.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
