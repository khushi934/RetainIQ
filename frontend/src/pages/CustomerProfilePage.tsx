import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Brain,
  Info
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
      <div className="py-28 text-center text-[#697386] text-[13px]">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-5 h-5 border-2 border-[#E6E8EC] border-t-[#315E81] rounded-full animate-spin"></div>
          <span>Loading customer record from MySQL...</span>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="p-8 bg-white border border-[#E6E8EC] rounded-lg text-center space-y-3 max-w-lg mx-auto">
        <div className="text-[14px] font-medium text-[#C75B58]">{error || 'Customer record not found.'}</div>
        <Link to="/app/customers" className="text-[13px] text-[#315E81] hover:underline block">
          &larr; Return to Customers
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Link
          to="/app/customers"
          className="p-1.5 rounded-md border border-[#E6E8EC] bg-white hover:bg-[#F7F8FA] text-[#697386] transition-colors"
          aria-label="Back to Customer Directory"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-[24px] font-semibold text-[#20242C] tracking-tight font-mono">
              {customer.customer_identifier}
            </h1>
            <RiskBadge
              tier={customer.latest_risk_tier}
              probability={customer.latest_predicted_churn_probability}
            />
            <span className={`text-[12px] font-medium px-2 py-0.5 rounded border ${
              customer.observed_churn
                ? 'bg-[#FBF2F2] text-[#C75B58] border-[#F2D5D4]'
                : 'bg-[#F0F7F3] text-[#3E8B69] border-[#D4EADB]'
            }`}>
              {customer.observed_churn ? 'Historical Churn' : 'Active Account'}
            </span>
          </div>
          <p className="text-[12px] text-[#697386] mt-0.5">
            Internal Record #{customer.id} &bull; Stored in MySQL `customers` table
          </p>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 border border-[#E6E8EC] rounded-lg">
          <div className="text-[12px] font-medium text-[#697386]">Monthly Charges</div>
          <div className="text-[26px] font-semibold text-[#20242C] font-mono mt-1">
            ${customer.monthly_charges.toFixed(2)}
          </div>
          <div className="text-[11px] text-[#697386] mt-0.5">Recurring revenue</div>
        </div>

        <div className="bg-white p-5 border border-[#E6E8EC] rounded-lg">
          <div className="text-[12px] font-medium text-[#697386]">Total Charges</div>
          <div className="text-[26px] font-semibold text-[#20242C] font-mono mt-1">
            ${customer.total_charges.toFixed(2)}
          </div>
          <div className="text-[11px] text-[#697386] mt-0.5">Lifetime billed</div>
        </div>

        <div className="bg-white p-5 border border-[#E6E8EC] rounded-lg">
          <div className="text-[12px] font-medium text-[#697386]">Tenure Duration</div>
          <div className="text-[26px] font-semibold text-[#20242C] font-mono mt-1">
            {customer.tenure_months} mos
          </div>
          <div className="text-[11px] text-[#697386] mt-0.5">Account age</div>
        </div>

        <div className="bg-white p-5 border border-[#E6E8EC] rounded-lg">
          <div className="text-[12px] font-medium text-[#697386]">Contract Structure</div>
          <div className="text-[20px] font-semibold text-[#20242C] mt-1.5 truncate">
            {customer.contract_type}
          </div>
          <div className="text-[11px] text-[#697386] mt-0.5">{customer.payment_method || 'Standard billing'}</div>
        </div>
      </div>

      {/* Account Attributes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-[#E6E8EC] rounded-lg p-5">
          <h2 className="text-[15px] font-semibold text-[#20242C] mb-3 pb-2 border-b border-[#E6E8EC]">
            Subscription & Service Attributes
          </h2>
          <dl className="grid grid-cols-2 gap-3 text-[13px]">
            <div>
              <dt className="text-[#697386] text-[12px]">Internet Service</dt>
              <dd className="font-medium text-[#20242C] mt-0.5">{customer.internet_service || 'None'}</dd>
            </div>
            <div>
              <dt className="text-[#697386] text-[12px]">Phone Service</dt>
              <dd className="font-medium text-[#20242C] mt-0.5">{customer.phone_service || 'No'}</dd>
            </div>
            <div>
              <dt className="text-[#697386] text-[12px]">Multiple Lines</dt>
              <dd className="font-medium text-[#20242C] mt-0.5">{customer.multiple_lines || 'No'}</dd>
            </div>
            <div>
              <dt className="text-[#697386] text-[12px]">Online Security</dt>
              <dd className="font-medium text-[#20242C] mt-0.5">{customer.online_security || 'No'}</dd>
            </div>
            <div>
              <dt className="text-[#697386] text-[12px]">Online Backup</dt>
              <dd className="font-medium text-[#20242C] mt-0.5">{customer.online_backup || 'No'}</dd>
            </div>
            <div>
              <dt className="text-[#697386] text-[12px]">Device Protection</dt>
              <dd className="font-medium text-[#20242C] mt-0.5">{customer.device_protection || 'No'}</dd>
            </div>
            <div>
              <dt className="text-[#697386] text-[12px]">Tech Support</dt>
              <dd className="font-medium text-[#20242C] mt-0.5">{customer.tech_support || 'No'}</dd>
            </div>
            <div>
              <dt className="text-[#697386] text-[12px]">Paperless Billing</dt>
              <dd className="font-medium text-[#20242C] mt-0.5">{customer.paperless_billing ? 'Yes' : 'No'}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white border border-[#E6E8EC] rounded-lg p-5">
          <h2 className="text-[15px] font-semibold text-[#20242C] mb-3 pb-2 border-b border-[#E6E8EC]">
            Predictive Model Assessment
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-md">
              <div>
                <span className="text-[12px] text-[#697386] block">Model Prediction</span>
                <span className="text-[18px] font-semibold text-[#20242C] font-mono">
                  {customer.latest_predicted_churn_probability
                    ? `${(customer.latest_predicted_churn_probability * 100).toFixed(1)}% Churn Probability`
                    : 'Unscored'}
                </span>
              </div>
              <RiskBadge
                tier={customer.latest_risk_tier}
                probability={customer.latest_predicted_churn_probability}
              />
            </div>

            <div className="p-3 bg-[#F7F8FA] border border-[#E6E8EC] rounded-md text-[12px] text-[#697386] flex items-start space-x-2">
              <Info className="w-4 h-4 text-[#315E81] shrink-0 mt-0.5" />
              <span>
                Model predictions reflect statistical estimates from trained classification trees. Observational correlation does not confirm causality.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
