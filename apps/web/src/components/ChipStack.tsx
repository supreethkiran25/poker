import React from 'react';
import { formatRupee } from '@poker/shared';
import { CasinoChipStack3D, type ChipColor } from './CasinoChip3D.js';

interface ChipStackProps {
  amount: number;
  size?: 'xs' | 'sm' | 'md';
  showLabel?: boolean;
}

export function formatChips(val: number): string {
  return formatRupee(val);
}

function getChipColor(amount: number): ChipColor {
  if (amount >= 5000) return 'gold';
  if (amount >= 1000) return 'black';
  if (amount >= 500) return 'blue';
  if (amount >= 100) return 'green';
  if (amount >= 25) return 'red';
  return 'white';
}

export const ChipStack: React.FC<ChipStackProps> = ({
  amount,
  size = 'md',
  showLabel = true,
}) => {
  if (amount <= 0) return null;

  const chipColor = getChipColor(amount);
  const chipDiameter = size === 'xs' ? 16 : size === 'sm' ? 20 : 24;
  const stackCount = amount >= 2000 ? 3 : amount >= 500 ? 2 : 1;

  return (
    <div
      className={`inline-flex items-center gap-1.5 bg-gradient-to-r from-zinc-950/95 via-black/90 to-zinc-950/95 backdrop-blur-md rounded-full border border-amber-500/40 shadow-[0_3px_12px_rgba(0,0,0,0.7),0_0_8px_rgba(245,158,11,0.15)] transition-transform hover:scale-105 select-none ${
        size === 'xs' ? 'px-1.5 py-0.5' : size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1'
      }`}
    >
      {/* 3D Authentic Clay Casino Chip Stack (Image 2 design) */}
      <CasinoChipStack3D
        color={chipColor}
        count={stackCount}
        sizePx={chipDiameter}
        label="₹"
        className="shrink-0"
      />

      {/* Amount Label */}
      {showLabel && (
        <span
          className={`font-mono font-black text-amber-200 tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] ${
            size === 'xs' ? 'text-[10px]' : size === 'sm' ? 'text-xs' : 'text-xs sm:text-sm'
          }`}
        >
          {formatRupee(amount)}
        </span>
      )}
    </div>
  );
};
