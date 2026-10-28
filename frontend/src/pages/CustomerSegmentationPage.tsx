import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart as PieIcon,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  ArrowRight,
  ShieldAlert,
  Users
} from 'lucide-react';
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
      return 'bg-rose-50 text-rose-800 border-rose-200';
    } else if (profile.includes('Elevated')) {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    } else if (profile.includes('Moderate')) {
      return 'bg-blue-50 text-blue-800 border-blue-200';
    }
    return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500 text-xs">
        Aggregating multi-dimensional customer segments from MySQL...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
          Customer Segmentation & Churn Clusters
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Multi-dimensional groupings combining contract types and internet service to isolate churn concentration
        </p>
      </div>

      {/* Segment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {segments.map((seg, idx) => (
          <div
            key={idx}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getRiskBadge(seg.risk_profile)}`}>
                  {seg.risk_profile}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {seg.customer_count} accounts
                </span>
              </div>

              <h2 className="text-base font-bold text-slate-900 mt-1">
                {seg.segment_name}
              </h2>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-500">Observed Churn Rate:</span>
                  <span className={`font-mono font-bold text-sm ${seg.churn_rate_pct >= 35 ? 'text-rose-600' : 'text-slate-900'}`}>
                    {seg.churn_rate_pct}%
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-500">Churned Customers:</span>
                  <span className="font-mono text-slate-700">{seg.churned_count} of {seg.customer_count}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-500">Avg Monthly Revenue:</span>
                  <span className="font-mono text-slate-700">${seg.avg_monthly_charges.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-slate-100 font-semibold">
                  <span className="text-slate-600">Total Monthly Spend:</span>
                  <span className="font-mono text-slate-900">${seg.total_revenue.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/app/decision-lab')}
              className="mt-5 w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
            >
              <span>Simulate Strategy in Decision Lab</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
