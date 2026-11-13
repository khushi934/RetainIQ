import React from 'react';

interface RiskBadgeProps {
  tier?: string | null;
  probability?: number | null;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ tier, probability }) => {
  if (!tier) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#F7F8FA] text-[#697386] border border-[#E6E8EC]">
        Unscored
      </span>
    );
  }

  const normalized = tier.toLowerCase();
  let colorStyle = 'bg-[#F7F8FA] text-[#697386] border-[#E6E8EC]';
  let dotColor = 'bg-[#697386]';

  if (normalized === 'high') {
    colorStyle = 'bg-[#FBF2F2] text-[#C75B58] border-[#F2D5D4]';
    dotColor = 'bg-[#C75B58]';
  } else if (normalized === 'medium') {
    colorStyle = 'bg-[#FDF7EE] text-[#D69A37] border-[#F7E4C4]';
    dotColor = 'bg-[#D69A37]';
  } else if (normalized === 'low') {
    colorStyle = 'bg-[#F0F7F3] text-[#3E8B69] border-[#D4EADB]';
    dotColor = 'bg-[#3E8B69]';
  }

  return (
    <span className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[12px] font-medium border ${colorStyle}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
      <span>{tier}</span>
      {probability !== undefined && probability !== null && (
        <span className="opacity-75 font-mono text-[11px]">
          ({Math.round(probability * 100)}%)
        </span>
      )}
    </span>
  );
};
