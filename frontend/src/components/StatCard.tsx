import React from 'react';
import { HelpCircle } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  formula?: string;
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
  badge
}) => {
  const badgeStyles = {
    positive: 'bg-[#F0F7F3] text-[#3E8B69] border-[#D4EADB]',
    warning: 'bg-[#FDF7EE] text-[#D69A37] border-[#F7E4C4]',
    negative: 'bg-[#FBF2F2] text-[#C75B58] border-[#F2D5D4]',
    neutral: 'bg-[#F7F8FA] text-[#697386] border-[#E6E8EC]',
  };

  return (
    <div className="bg-white border border-[#E6E8EC] rounded-xl p-6 transition-all hover:shadow-md hover:border-[#D1D5DB]">
      {/* Top Row: label + badge */}
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold uppercase tracking-wide text-[#697386]">
            {title}
          </span>
          {formula && (
            <div className="group relative cursor-help">
              <HelpCircle className="w-4 h-4 text-[#697386]/60 hover:text-[#697386]" />
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-60 p-3 bg-[#20242C] text-white text-xs rounded-lg shadow-xl z-30 pointer-events-none leading-relaxed">
                {formula}
              </div>
            </div>
          )}
        </div>
        {badge && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${badgeStyles[badge.variant]}`}>
            {badge.text}
          </span>
        )}
      </div>

      {/* Metric Value — big and bold */}
      <div className="text-4xl font-bold text-[#20242C] tracking-tight leading-none mb-3">
        {value}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-sm text-[#697386] leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
};
