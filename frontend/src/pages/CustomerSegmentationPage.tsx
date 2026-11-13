import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { SegmentPerformance } from '../types';

export const CustomerSegmentationPage: React.FC = () => {
  const navigate = useNavigate();
  const [segments, setSegments] = useState<SegmentPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSegments();
  }, []);

  const loadSegments = async () => {
    try {
      const data = await api.getSegments();
      setSegments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadge = (profile: string) => {
    if (profile.includes('Critical')) {
      return 'bg-[#FBF2F2] text-[#C75B58] border-[#F2D5D4]';
    } else if (profile.includes('Elevated')) {
      return 'bg-[#FDF7EE] text-[#D69A37] border-[#F7E4C4]';
    } else if (profile.includes('Moderate')) {
      return 'bg-[#F0F5F9] text-[#315E81] border-[#E6E8EC]';
    }
    return 'bg-[#F0F7F3] text-[#3E8B69] border-[#D4EADB]';
  };

  if (loading) {
    return (
      <div className="py-28 text-center text-[#697386] text-[13px]">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-5 h-5 border-2 border-[#E6E8EC] border-t-[#315E81] rounded-full animate-spin"></div>
          <span>Aggregating segment performance from MySQL...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[26px] font-semibold text-[#20242C] tracking-tight">
          Segments
        </h1>
        <p className="text-[14px] text-[#697386] mt-1">
          Customer cohorts combining contract types and services to identify retention vulnerability.
        </p>
      </div>

      {/* Segment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {segments.map((seg, idx) => (
          <div
            key={idx}
            className="bg-white border border-[#E6E8EC] rounded-lg p-5 flex flex-col justify-between hover:border-[#D1D5DB] transition-colors"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${getRiskBadge(seg.risk_profile)}`}>
                  {seg.risk_profile}
                </span>
                <span className="text-[12px] text-[#697386] font-mono">
                  {seg.customer_count} accounts
                </span>
              </div>

              <h2 className="text-[16px] font-semibold text-[#20242C] mt-2">
                {seg.segment_name}
              </h2>

              <div className="mt-4 space-y-2 text-[13px]">
                <div className="flex justify-between items-baseline">
                  <span className="text-[#697386]">Observed Churn Rate:</span>
                  <span className={`font-mono font-semibold ${seg.churn_rate_pct >= 35 ? 'text-[#C75B58]' : 'text-[#20242C]'}`}>
                    {seg.churn_rate_pct}%
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[#697386]">Churned Accounts:</span>
                  <span className="font-mono text-[#20242C]">{seg.churned_count} of {seg.customer_count}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[#697386]">Average Monthly Charge:</span>
                  <span className="font-mono text-[#20242C]">${seg.avg_monthly_charges.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-[#E6E8EC]">
              <button
                onClick={() => navigate('/app/decision-lab')}
                className="w-full py-2 bg-[#F7F8FA] hover:bg-[#E6E8EC] text-[#20242C] rounded text-[12px] font-medium transition-colors flex items-center justify-center space-x-1"
              >
                <span>Simulate Intervention</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
