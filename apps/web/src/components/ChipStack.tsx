import React from 'react';
import { formatRupee, VIRTUAL_CURRENCY_SYMBOL } from '@poker/shared';

interface ChipStackProps {
  amount: number;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export function formatChips(val: number): string {
  return formatRupee(val);
}

export const ChipStack: React.FC<ChipStackProps> = ({
  amount,
  size = 'md',
  showLabel = true,
}) => {
  if (amount <= 0) return null;

  // Determine chip edge colors
  let chipColor = 'from-blue-600 to-blue-800 border-blue-400';
  if (amount >= 10000) chipColor = 'from-amber-500 to-yellow-600 border-yellow-300';
  else if (amount >= 5000) chipColor = 'from-purple-600 to-purple-800 border-purple-400';
  else if (amount >= 1000) chipColor = 'from-zinc-800 to-zinc-950 border-zinc-500';
  else if (amount >= 100) chipColor = 'from-emerald-600 to-emerald-800 border-emerald-400';
  else if (amount >= 50) chipColor = 'from-rose-600 to-rose-800 border-rose-400';

  const chipSize = size === 'sm' ? 'w-4 h-4 text-[9px]' : 'w-5 h-5 text-[10px]';

  return (
    <div className="inline-flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-full border border-amber-500/30 shadow-chip">
      <div className="relative flex items-center justify-center">
        <div
          className={`${chipSize} rounded-full bg-gradient-to-tr ${chipColor} border shadow-inner flex items-center justify-center font-black text-white`}
        >
          {VIRTUAL_CURRENCY_SYMBOL}
        </div>
      </div>
      {showLabel && (
        <span className="font-mono font-bold text-amber-200 text-xs tracking-tight">
          {formatRupee(amount)}
        </span>
      )}
    </div>
  );
};
