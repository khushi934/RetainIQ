import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Database,
  Brain,
  FlaskConical,
  UploadCloud,
  FileSpreadsheet,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
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
      <div className="flex items-center justify-center py-32 text-[#697386]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-3 border-[#E6E8EC] border-t-[#315E81] rounded-full animate-spin"></div>
          <span className="text-base font-medium">Loading retention analytics…</span>
        </div>
      </div>
    );
  }

  const riskChartData = riskDist.map((d) => ({
    tier: d.risk_tier || d.tier || 'Unknown',
    customers: d.customer_count,
    percentage: d.percentage
  }));

  return (
    <div className="space-y-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#20242C] tracking-tight">Overview</h1>
          <p className="text-base text-[#697386] mt-1">
            Monitor customer retention performance and identify areas that need attention.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={loadDashboardData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E6E8EC] hover:bg-[#F7F8FA] text-[#20242C] rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-[#697386]" />
            Refresh
          </button>
          <Link
            to="/app/import"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E6E8EC] hover:bg-[#F7F8FA] text-[#20242C] rounded-lg text-sm font-medium transition-colors"
          >
            <UploadCloud className="w-4 h-4 text-[#697386]" />
            Import Data
          </Link>
          <Link
            to="/app/decision-lab"
            className="flex items-center gap-2 px-4 py-2 bg-[#315E81] hover:bg-[#274b68] text-white rounded-lg text-sm font-medium transition-colors"
          >
            <FlaskConical className="w-4 h-4" />
            Decision Lab
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-[#FBF2F2] border border-[#F2D5D4] rounded-xl text-sm text-[#C75B58]">
          {error}
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          title="Total Customers"
          value={overview?.total_customers.toLocaleString() || '0'}
          subtitle={`${overview?.active_customers || 0} active · ${overview?.churned_customers || 0} churned`}
          formula="COUNT(*) from customers in active workspace"
        />
        <StatCard
          title="Historical Churn Rate"
          value={`${overview?.observed_churn_rate_pct || 0}%`}
          subtitle={`Retention rate: ${overview?.observed_retention_rate_pct || 0}%`}
          formula="Observed churned customers / Total customers × 100"
          badge={{
            text: (overview?.observed_churn_rate_pct || 0) > 25 ? 'Elevated' : 'Baseline',
            variant: (overview?.observed_churn_rate_pct || 0) > 25 ? 'warning' : 'neutral'
          }}
        />
        <StatCard
          title="Predicted High-Risk"
          value={overview?.high_risk_customers_count?.toLocaleString() || '0'}
          subtitle={`$${(overview?.revenue_at_risk || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} MRR at risk`}
          formula="Customers with predicted churn probability ≥ 0.60"
          badge={{
            text: (overview?.high_risk_customers_count || 0) > 0 ? 'Action Needed' : 'Low Exposure',
            variant: (overview?.high_risk_customers_count || 0) > 0 ? 'negative' : 'positive'
          }}
        />
        <StatCard
          title="Avg. Customer Tenure"
          value={`${overview?.avg_tenure_months || 0} mos`}
          subtitle={`Median: ${overview?.median_tenure_months || 0} months`}
          formula="AVG(tenure_months) across all customer records"
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Historical Churn by Contract */}
        <div className="bg-white border border-[#E6E8EC] rounded-xl p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-[#20242C]">
              Historical Churn by Contract Type
            </h2>
            <p className="text-sm text-[#697386] mt-1">
              Observed churn rate across contract structures from MySQL aggregation.
            </p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contracts} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F2F5" />
                <XAxis dataKey="contract_type" stroke="#697386" fontSize={13} tickLine={false} axisLine={false} />
                <YAxis stroke="#697386" fontSize={13} tickLine={false} axisLine={false} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#20242C', border: 'none', color: '#FFF', fontSize: '13px', borderRadius: '8px', padding: '10px 14px' }}
                  formatter={(val: any) => [`${val}%`, 'Churn Rate']}
                />
                <Bar dataKey="churn_rate_pct" name="Churn Rate" fill="#315E81" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Customer Risk Distribution */}
        <div className="bg-white border border-[#E6E8EC] rounded-xl p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-[#20242C]">
              Customer Risk Distribution
            </h2>
            <p className="text-sm text-[#697386] mt-1">
              Customer accounts by ML model predicted churn probability tier.
            </p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskChartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F2F5" />
                <XAxis dataKey="tier" stroke="#697386" fontSize={13} tickLine={false} axisLine={false} />
                <YAxis stroke="#697386" fontSize={13} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#20242C', border: 'none', color: '#FFF', fontSize: '13px', borderRadius: '8px', padding: '10px 14px' }}
                  formatter={(val: any) => [`${val} accounts`, 'Count']}
                />
                <Bar dataKey="customers" name="Customers" fill="#438A83" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Tenure Cohort Analysis ── */}
      <div className="bg-white border border-[#E6E8EC] rounded-xl p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-[#20242C]">Customer Tenure Cohort Analysis</h2>
          <p className="text-sm text-[#697386] mt-1">
            Observed churn rates segmented by customer tenure duration cohorts.
          </p>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tenureCohorts} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F2F5" />
              <XAxis dataKey="cohort_range" stroke="#697386" fontSize={13} tickLine={false} axisLine={false} />
              <YAxis stroke="#697386" fontSize={13} tickLine={false} axisLine={false} unit="%" />
              <Tooltip
                contentStyle={{ backgroundColor: '#20242C', border: 'none', color: '#FFF', fontSize: '13px', borderRadius: '8px', padding: '10px 14px' }}
                formatter={(val: any) => [`${val}%`, 'Churn Rate']}
              />
              <Bar dataKey="churn_rate_pct" name="Churn Rate" fill="#D69A37" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Bottom Row: High Risk Table + Recent Datasets ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* High Risk Table */}
        <div className="lg:col-span-2 bg-white border border-[#E6E8EC] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-[#E6E8EC]">
            <div>
              <h2 className="text-lg font-semibold text-[#20242C]">Highest Predicted Risk Customers</h2>
              <p className="text-sm text-[#697386] mt-0.5">Accounts with churn probability ≥ 60% from ML classifier</p>
            </div>
            <Link
              to="/app/customers"
              className="flex items-center gap-1.5 text-sm font-medium text-[#315E81] hover:underline"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="data-table-header">Customer ID</th>
                  <th className="data-table-header">Contract</th>
                  <th className="data-table-header">Tenure</th>
                  <th className="data-table-header text-right">Monthly</th>
                  <th className="data-table-header">Risk Tier</th>
                </tr>
              </thead>
              <tbody>
                {highRiskCustomers.map((c) => (
                  <tr key={c.id} className="data-table-row">
                    <td className="data-table-cell font-mono text-[#315E81] font-semibold">
                      <Link to={`/app/customers/${c.id}`} className="hover:underline">
                        {c.customer_identifier}
                      </Link>
                    </td>
                    <td className="data-table-cell text-[#20242C]">{c.contract_type}</td>
                    <td className="data-table-cell text-[#697386]">{c.tenure_months} mos</td>
                    <td className="data-table-cell text-[#20242C] font-mono text-right font-semibold">
                      ${c.monthly_charges.toFixed(2)}
                    </td>
                    <td className="data-table-cell">
                      <RiskBadge
                        tier={c.latest_prediction?.risk_tier || c.latest_risk_tier || 'High'}
                        probability={c.latest_prediction?.predicted_churn_probability ?? c.latest_predicted_churn_probability}
                      />
                    </td>
                  </tr>
                ))}
                {highRiskCustomers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-sm text-[#697386]">
                      No high-risk customers identified. Import customer data to run predictions.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Datasets */}
        <div className="bg-white border border-[#E6E8EC] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-[#E6E8EC]">
            <div>
              <h2 className="text-lg font-semibold text-[#20242C]">Data Imports</h2>
              <p className="text-sm text-[#697386] mt-0.5">Recent datasets in MySQL</p>
            </div>
            <Link
              to="/app/import"
              className="flex items-center gap-1.5 text-sm font-medium text-[#315E81] hover:underline"
            >
              Manage <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="p-4 space-y-3">
            {recentDatasets.slice(0, 5).map((ds, idx) => (
              <div
                key={ds.id || idx}
                className="flex items-start gap-3 p-3 bg-[#F7F8FA] border border-[#E6E8EC] rounded-lg"
              >
                <FileSpreadsheet className="w-5 h-5 text-[#315E81] shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-[#20242C] truncate">{ds.name}</div>
                  <div className="text-xs text-[#697386] mt-0.5">
                    {ds.row_count?.toLocaleString()} rows · {ds.status || 'imported'}
                  </div>
                </div>
              </div>
            ))}
            {recentDatasets.length === 0 && (
              <div className="py-8 text-center text-sm text-[#697386]">
                No datasets imported yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
