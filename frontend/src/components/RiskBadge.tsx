import React from 'react';

interface RiskBadgeProps {
  tier?: 'Low' | 'Medium' | 'High' | string;
  probability?: number;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ tier, probability }) => {
  const styles = {
    High: 'bg-[#FBF2F2] text-[#C75B58] border-[#F2D5D4]',
    Medium: 'bg-[#FDF7EE] text-[#D69A37] border-[#F7E4C4]',
    Low: 'bg-[#F0F7F3] text-[#3E8B69] border-[#D4EADB]',
  };

  const dotColors = {
    High: 'bg-[#C75B58]',
    Medium: 'bg-[#D69A37]',
    Low: 'bg-[#3E8B69]',
  };

  const resolvedTier = (tier as keyof typeof styles) || 'Low';
  const style = styles[resolvedTier] || styles.Low;
  const dotColor = dotColors[resolvedTier] || dotColors.Low;

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold border ${style}`}>
      <span className={`w-2 h-2 rounded-full ${dotColor} shrink-0`} />
      {resolvedTier}
      {probability !== undefined && (
        <span className="opacity-70 text-xs font-normal">
          {(probability * 100).toFixed(0)}%
        </span>
      )}
    </span>
  );
};
