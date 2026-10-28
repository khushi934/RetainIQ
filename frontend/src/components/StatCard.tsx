import React from 'react';
import { HelpCircle } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  formula?: string;
  icon?: React.ElementType;
  badge?: {
    text: string;
    variant: 'positive' | 'warning' | 'negative' | 'neutral';
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  formula,
  icon: Icon,
  badge
}) => {
  const badgeColors = {
    positive: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    negative: 'bg-rose-50 text-rose-700 border-rose-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs transition-shadow hover:shadow-sm">
      <div className="flex items-center justify-between text-slate-500 mb-2">
        <div className="flex items-center space-x-1.5">
          <span className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
            {title}
          </span>
          {formula && (
            <div className="group relative cursor-help">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
              <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover:block w-48 p-2 bg-slate-900 text-white text-[11px] rounded shadow-md z-30 pointer-events-none">
                {formula}
              </div>
            </div>
          )}
        </div>
        {Icon && (
          <div className="p-1.5 rounded-md bg-slate-50 text-slate-600 border border-slate-100">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline space-x-2.5">
        <span className="text-2xl font-bold text-slate-900 tracking-tight">
          {value}
        </span>
        {badge && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${badgeColors[badge.variant]}`}>
            {badge.text}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-slate-500 mt-1.5 font-normal">
          {subtitle}
        </p>
      )}
    </div>
  );
};
