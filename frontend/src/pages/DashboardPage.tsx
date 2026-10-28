import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  AlertTriangle,
  TrendingDown,
  DollarSign,
  Clock,
  ShieldAlert,
  ArrowRight,
  Database,
  Brain,
  FlaskConical,
  Sparkles,
  BarChart2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { api } from '../services/api';
import { OverviewMetrics, ChurnByContract, ChurnTrendPoint, Customer, RiskTierDistribution } from '../types';
import { StatCard } from '../components/StatCard';
import { RiskBadge } from '../components/RiskBadge';

export const DashboardPage: React.FC = () => {
  const [overview, setOverview] = useState<OverviewMetrics | null>(null);
  const [contracts, setContracts] = useState<ChurnByContract[]>([]);
  const [trends, setTrends] = useState<ChurnTrendPoint[]>([]);
  const [riskDist, setRiskDist] = useState<RiskTierDistribution[]>([]);
  const [highRiskCustomers, setHighRiskCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ov, ct, tr, rd, custs] = await Promise.all([
        api.getOverview(),
        api.getContracts(),
        api.getChurnTrends(),
        api.getRiskDistribution(),
        api.getCustomers({ page: 1, page_size: 5, risk: 'High', sort_by: 'monthly_charges', sort_order: 'desc' })
      ]);
      setOverview(ov);
      setContracts(ct);
      setTrends(tr);
      setRiskDist(rd);
      setHighRiskCustomers(custs.items);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
          <span className="text-xs font-medium">Aggregating MySQL retention metrics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Retention Intelligence Overview
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Ground-truth SQL aggregations &bull; Verified MySQL dataset &bull; Model estimates clearly separated
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Link
            to="/app/decision-lab"
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Simulate Retention Campaign</span>
          </Link>
          <Link
            to="/app/assistant"
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Ask AI Analyst</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
          {error}
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Customers"
          value={overview?.total_customers.toLocaleString() || '0'}
          subtitle={`${overview?.active_customers || 0} Active • ${overview?.churned_customers || 0} Churned`}
          formula="COUNT(*) from customers in active workspace"
          icon={Users}
        />
        <StatCard
          title="Observed Churn Rate"
          value={`${overview?.observed_churn_rate_pct || 0}%`}
          subtitle={`Retention Rate: ${overview?.observed_retention_rate_pct || 0}%`}
          formula="Count of observed churned customers / Total eligible customers * 100"
          icon={TrendingDown}
          badge={{
            text: (overview?.observed_churn_rate_pct || 0) > 25 ? 'Elevated' : 'Normal',
            variant: (overview?.observed_churn_rate_pct || 0) > 25 ? 'warning' : 'neutral'
          }}
        />
        <StatCard
          title="Monthly Recurring Revenue"
          value={`$${(overview?.monthly_recurring_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle={`ARPU: $${(overview?.avg_revenue_per_customer || 0).toFixed(2)} / month`}
          formula="SUM(monthly_charges) across customer base"
          icon={DollarSign}
        />
        <StatCard
          title="Revenue at Risk"
          value={`$${(overview?.revenue_at_risk || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle={`${overview?.high_risk_customers_count || 0} high-risk predicted customers`}
          formula="SUM(monthly_charges) for customers with predicted churn probability >= 0.60"
          icon={ShieldAlert}
          badge={{
            text: (overview?.high_risk_customers_count || 0) > 0 ? 'High Risk' : 'Protected',
            variant: (overview?.high_risk_customers_count || 0) > 0 ? 'negative' : 'positive'
          }}
        />
      </div>

      {/* Primary Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Churn by Contract Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Observed Churn Rate by Contract Type
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluates historical contract churn vulnerability &bull; Parameterized MySQL query
              </p>
            </div>
            <span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
              Contract Breakdown
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contracts} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="contract_type" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#0f172a', color: '#fff', fontSize: '12px', borderRadius: '6px' }}
                  formatter={(val: any) => [`${val}%`, 'Observed Churn Rate']}
                />
                <Bar dataKey="churn_rate_pct" name="Churn Rate" fill="#0f172a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Churn Trends Over Time */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Observed Monthly Activity
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Timestamp-grounded trendline
              </p>
            </div>
            <BarChart2 className="w-4 h-4 text-slate-400" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="period" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#0f172a', color: '#fff', fontSize: '11px', borderRadius: '6px' }}
                />
                <Line type="monotone" dataKey="churned_customers" name="Churned" stroke="#e11d48" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="active_customers" name="Active" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Grid: High-Risk Actionable Accounts & Model Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* High Risk Customer Table */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Highest Predicted Risk Customers
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Accounts with elevated model-estimated churn probabilities (&ge; 60%)
              </p>
            </div>
            <Link
              to="/app/customers"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <span>View All Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="data-table-header">Customer ID</th>
                  <th className="data-table-header">Contract</th>
                  <th className="data-table-header">Monthly</th>
                  <th className="data-table-header">Tenure</th>
                  <th className="data-table-header">Predicted Risk</th>
                  <th className="data-table-header text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {highRiskCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="data-table-cell text-center text-slate-400 py-8">
                      No high risk customers detected. Run model inference in Predictive Models workspace.
                    </td>
                  </tr>
                ) : (
                  highRiskCustomers.map((cust) => (
                    <tr key={cust.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="data-table-cell font-mono font-medium text-slate-900">
                        {cust.customer_identifier}
                      </td>
                      <td className="data-table-cell text-slate-600">
                        {cust.contract_type || 'Month-to-month'}
                      </td>
                      <td className="data-table-cell font-medium text-slate-800">
                        ${cust.monthly_charges.toFixed(2)}
                      </td>
                      <td className="data-table-cell text-slate-600">
                        {cust.tenure_months} mos
                      </td>
                      <td className="data-table-cell">
                        <RiskBadge
                          tier={cust.latest_risk_tier}
                          probability={cust.latest_predicted_churn_probability}
                        />
                      </td>
                      <td className="data-table-cell text-right">
                        <Link
                          to={`/app/customers/${cust.id}`}
                          className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline"
                        >
                          Profile
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Strategy Intelligence Widget */}
        <div className="bg-slate-900 text-white rounded-lg p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
              <FlaskConical className="w-4 h-4" />
              <span>Retention Decision Lab</span>
            </div>
            <h3 className="text-base font-bold text-white mt-2">
              Ready to test retention scenarios?
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Don't guess which customers to contact or which discount size makes financial sense.
              Input your target cohort, budget, and assumed retention uplift to calculate the <strong>Break-Even Retention Uplift</strong> and <strong>Expected Net Benefit</strong>.
            </p>

            <div className="mt-4 p-3 bg-slate-800/80 border border-slate-700/60 rounded-md text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Current High-Risk Customers:</span>
                <span className="font-bold text-amber-400">{overview?.high_risk_customers_count || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Monthly Spend at Stake:</span>
                <span className="font-bold text-white">${(overview?.revenue_at_risk || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <Link
            to="/app/decision-lab"
            className="mt-6 w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors shadow-xs"
          >
            <span>Launch Decision Simulator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
