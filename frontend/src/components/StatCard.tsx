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
    <div className="bg-white border border-[#E6E8EC] rounded-lg p-5 transition-colors hover:border-[#D1D5DB]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-1.5">
          <span className="text-[13px] font-medium text-[#697386]">
            {title}
          </span>
          {formula && (
            <div className="group relative cursor-help">
              <HelpCircle className="w-3.5 h-3.5 text-[#697386]/60 hover:text-[#697386]" />
              <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover:block w-52 p-2 bg-[#20242C] text-white text-[11px] rounded shadow-md z-30 pointer-events-none leading-relaxed">
                {formula}
              </div>
            </div>
          )}
        </div>
        {badge && (
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${badgeStyles[badge.variant]}`}>
            {badge.text}
          </span>
        )}
      </div>

      <div className="text-[28px] font-semibold text-[#20242C] tracking-tight leading-tight">
        {value}
      </div>

      {subtitle && (
        <p className="text-[12px] text-[#697386] mt-2 font-normal leading-normal">
          {subtitle}
        </p>
      )}
    </div>
  );
};
