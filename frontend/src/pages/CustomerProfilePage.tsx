import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  CreditCard,
  Wifi,
  Calendar,
  AlertTriangle,
  Brain,
  ShieldCheck,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { api } from '../services/api';
import { Customer } from '../types';
import { RiskBadge } from '../components/RiskBadge';

export const CustomerProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadProfile(parseInt(id, 10));
    }
  }, [id]);

  const loadProfile = async (customerId: number) => {
    setLoading(true);
    try {
      const data = await api.getCustomer(customerId);
      setCustomer(data);
    } catch (err: any) {
      setError(err.message || 'Customer not found.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500 text-xs">
        Loading customer profile from MySQL...
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="p-6 bg-white border border-slate-200 rounded-lg text-center space-y-3">
        <div className="text-sm font-semibold text-rose-600">{error || 'Customer record not found.'}</div>
        <Link to="/app/customers" className="text-xs text-blue-600 hover:underline">
          &larr; Back to Customer Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button and profile header */}
      <div className="flex items-center space-x-3">
        <Link
          to="/app/customers"
          className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight font-mono">
              {customer.customer_identifier}
            </h1>
            <RiskBadge
              tier={customer.latest_risk_tier}
              probability={customer.latest_predicted_churn_probability}
            />
            {customer.observed_churn ? (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                Observed Churned
              </span>
            ) : (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active Account
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Customer ID #{customer.id} &bull; Workspace Record &bull; Last verified in MySQL
          </p>
        </div>
      </div>

      {/* Profile Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Monthly Charges</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">${customer.monthly_charges.toFixed(2)}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Billed monthly</div>
        </div>

        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tenure</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{customer.tenure_months} mos</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Account lifecycle duration</div>
        </div>

        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Billed</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">${customer.total_charges.toFixed(2)}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Cumulative customer revenue</div>
        </div>

        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Engagement Score</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {customer.engagement_score !== null && customer.engagement_score !== undefined
              ? customer.engagement_score
              : 'N/A'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Activity index (0-100)</div>
        </div>
      </div>

      {/* Main Grid: Contract/Services vs ML Prediction Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Account Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contract & Billing Details */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-slate-600" />
              <span>Contract & Billing Terms</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Contract Plan</span>
                <span className="font-semibold text-slate-800">{customer.contract_type || 'Month-to-month'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Payment Method</span>
                <span className="font-semibold text-slate-800">{customer.payment_method || 'Electronic check'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Paperless Billing</span>
                <span className="font-semibold text-slate-800">{customer.paperless_billing || 'No'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Gender</span>
                <span className="font-semibold text-slate-800">{customer.gender || 'Unknown'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Senior Citizen</span>
                <span className="font-semibold text-slate-800">{customer.senior_citizen ? 'Yes' : 'No'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Dependents / Partner</span>
                <span className="font-semibold text-slate-800">
                  {customer.partner === 'Yes' ? 'Partner' : 'No partner'} &bull; {customer.dependents === 'Yes' ? 'Dependents' : 'No dependents'}
                </span>
              </div>
            </div>
          </div>

          {/* Subscribed Telecom Services */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
              <Wifi className="w-4 h-4 text-slate-600" />
              <span>Services & Features</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-md">
                <span className="text-slate-400 block mb-0.5">Internet Type</span>
                <span className="font-semibold text-slate-800">{customer.internet_service || 'None'}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-md">
                <span className="text-slate-400 block mb-0.5">Phone Service</span>
                <span className="font-semibold text-slate-800">{customer.phone_service || 'No'}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-md">
                <span className="text-slate-400 block mb-0.5">Multiple Lines</span>
                <span className="font-semibold text-slate-800">{customer.multiple_lines || 'No'}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-md">
                <span className="text-slate-400 block mb-0.5">Online Security</span>
                <span className="font-semibold text-slate-800">{customer.online_security || 'No'}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-md">
                <span className="text-slate-400 block mb-0.5">Tech Support</span>
                <span className="font-semibold text-slate-800">{customer.tech_support || 'No'}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-md">
                <span className="text-slate-400 block mb-0.5">Streaming TV</span>
                <span className="font-semibold text-slate-800">{customer.streaming_tv || 'No'}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-md">
                <span className="text-slate-400 block mb-0.5">Streaming Movies</span>
                <span className="font-semibold text-slate-800">{customer.streaming_movies || 'No'}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-md">
                <span className="text-slate-400 block mb-0.5">Device Protection</span>
                <span className="font-semibold text-slate-800">{customer.device_protection || 'No'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Predictive Risk Breakdown */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <div className="flex items-center space-x-2 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Brain className="w-4 h-4" />
              <span>Predictive Churn Assessment</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Model Estimated Risk
            </h3>

            {/* Probability Bar */}
            <div className="mt-4">
              <div className="flex justify-between items-baseline text-xs mb-1">
                <span className="font-medium text-slate-600">Predicted Probability</span>
                <span className="font-bold font-mono text-base text-slate-900">
                  {customer.latest_predicted_churn_probability !== undefined && customer.latest_predicted_churn_probability !== null
                    ? `${(customer.latest_predicted_churn_probability * 100).toFixed(1)}%`
                    : 'Not Scored'}
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    (customer.latest_predicted_churn_probability || 0) >= 0.60
                      ? 'bg-rose-500'
                      : (customer.latest_predicted_churn_probability || 0) >= 0.35
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, (customer.latest_predicted_churn_probability || 0) * 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0% (Low)</span>
                <span>35% (Medium)</span>
                <span>60%+ (High)</span>
              </div>
            </div>

            {/* Contributing factors */}
            <div className="mt-6 border-t border-slate-100 pt-4">
              <div className="text-xs font-semibold text-slate-700 mb-2">
                Identified Risk Drivers & Stabilizers
              </div>
              <div className="space-y-2">
                {customer.top_contributing_factors && customer.top_contributing_factors.length > 0 ? (
                  customer.top_contributing_factors.map((factor, idx) => (
                    <div key={idx} className="p-2.5 rounded bg-slate-50 border border-slate-100 text-xs flex justify-between items-center">
                      <span className="font-medium text-slate-800">{factor.factor}</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                        {factor.impact}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400">
                    No custom factors recorded.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 p-3 bg-amber-50/70 border border-amber-200/60 rounded text-[11px] text-amber-900 leading-relaxed">
              <strong>Methodological Disclosure:</strong> Features associated with a prediction are statistical correlates and not guaranteed root causes. Validate proposed interventions with randomized holdout testing.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
