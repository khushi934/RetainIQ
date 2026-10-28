import React from 'react';

interface RiskBadgeProps {
  tier?: string | null;
  probability?: number | null;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ tier, probability }) => {
  if (!tier) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
        Unscored
      </span>
    );
  }

  const normalized = tier.toLowerCase();
  let colorStyle = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';

  if (normalized === 'high') {
    colorStyle = 'bg-rose-50 text-rose-800 border-rose-200';
    dotColor = 'bg-rose-500';
  } else if (normalized === 'medium') {
    colorStyle = 'bg-amber-50 text-amber-800 border-amber-200';
    dotColor = 'bg-amber-500';
  } else if (normalized === 'low') {
    colorStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    dotColor = 'bg-emerald-500';
  }

  return (
    <span className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded border text-[11px] font-medium ${colorStyle}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
      <span>{tier} Risk</span>
      {probability !== undefined && probability !== null && (
        <span className="opacity-75 font-mono text-[10px]">
          ({Math.round(probability * 100)}%)
        </span>
      )}
    </span>
  );
};
