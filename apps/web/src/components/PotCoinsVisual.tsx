import React, { useState } from 'react';
import { formatRupee } from '@poker/shared';
import { soundManager } from '../audio/sound-manager.js';
import {
  CasinoChip3D,
  CasinoChipStack3D,
  GoldCoin3D,
  type ChipColor,
} from './CasinoChip3D.js';

// Re-export for compatibility
export { CasinoChip3D as CasinoChip, GoldCoin3D as GoldCoin };

interface PotCoinsVisualProps {
  pot: number;
  size?: 'sm' | 'md' | 'lg';
  showPlaque?: boolean;
  phase?: string;
  isHandComplete?: boolean;
  onCoinClick?: () => void;
}

/**
 * Main Pot Coins & 3D Casino Chips Visual Component
 * Features authentic 3D casino clay chips (matching Image 2) and high-gloss 3D gold coins
 */
export const PotCoinsVisual: React.FC<PotCoinsVisualProps> = ({
  pot,
  size = 'md',
  showPlaque = true,
  phase,
  isHandComplete = false,
  onCoinClick,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  if (pot <= 0) return null;

  // Sizing parameters
  const chipSize = size === 'sm' ? 24 : size === 'md' ? 30 : 34;
  const coinLeftSize = size === 'sm' ? 22 : 27;
  const coinRightSize = size === 'sm' ? 24 : 29;
  const coinCenterSize = size === 'sm' ? 20 : 25;

  // Determine stack piles based on pot size (using authentic Image 2 chip types)
  let stacks: { type: ChipColor; count: number }[] = [];
  if (pot >= 25000) {
    stacks = [
      { type: 'gold', count: 3 },
      { type: 'black', count: 2 },
      { type: 'blue', count: 3 },
      { type: 'green', count: 2 },
    ];
  } else if (pot >= 10000) {
    stacks = [
      { type: 'gold', count: 2 },
      { type: 'black', count: 3 },
      { type: 'blue', count: 2 },
    ];
  } else if (pot >= 5000) {
    stacks = [
      { type: 'black', count: 3 },
      { type: 'blue', count: 2 },
      { type: 'green', count: 2 },
    ];
  } else if (pot >= 1000) {
    stacks = [
      { type: 'blue', count: 2 },
      { type: 'green', count: 3 },
      { type: 'red', count: 2 },
    ];
  } else if (pot >= 300) {
    stacks = [
      { type: 'green', count: 2 },
      { type: 'red', count: 2 },
      { type: 'white', count: 2 },
    ];
  } else {
    stacks = [
      { type: 'red', count: 2 },
      { type: 'white', count: 2 },
    ];
  }

  const handleInteract = () => {
    soundManager.playCoinClink();
    if (onCoinClick) onCoinClick();
  };

  return (
    <div
      className="relative flex flex-col items-center pointer-events-auto select-none group"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={handleInteract}
    >
      {/* ── Pot Plaque (Sleek, Luxury Pot Badge with Integrated Gold Coin & Phase) ── */}
      {showPlaque && (
        <div className="relative z-30 flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-zinc-950/95 via-amber-950/70 to-zinc-950/95 backdrop-blur-xl px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full border border-amber-400/70 shadow-[0_4px_20px_rgba(0,0,0,0.8),0_0_12px_rgba(245,158,11,0.25)] transition-all group-hover:border-amber-400">
          {/* Gleaming 3D gold coin icon */}
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-600 flex items-center justify-center text-[10px] shadow-sm border border-amber-100 text-zinc-950 font-black shrink-0">
            ₹
          </div>

          <span className="text-[10px] uppercase tracking-[0.18em] text-amber-400 font-mono font-bold">
            POT
          </span>

          <span className="text-amber-500/40 font-mono text-[10px]">•</span>

          <span className="text-xs sm:text-sm font-black text-amber-300 font-mono tracking-tight drop-shadow-[0_1px_3px_rgba(245,158,11,0.5)]">
            {formatRupee(pot)}
          </span>

          {/* Integrated Phase badge */}
          {phase && phase !== 'HAND_COMPLETE' && phase !== 'WAITING_FOR_PLAYERS' && phase !== 'STARTING' && (
            <>
              <span className="text-emerald-500/50 font-mono text-[10px] hidden sm:inline">•</span>
              <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-300 font-bold bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/40">
                {phase.replace(/_/g, ' ')}
              </span>
            </>
          )}
        </div>
      )}

      {/* ── Hover Tooltip Breakdown ── */}
      {showTooltip && (
        <div className="absolute -top-12 z-50 px-3 py-1.5 rounded-xl bg-zinc-950/95 border border-amber-500/50 text-zinc-200 text-[11px] font-mono shadow-2xl backdrop-blur-md flex items-center gap-2 animate-fade-in pointer-events-none whitespace-nowrap">
          <span className="text-amber-400 font-bold">🪙 Active Pot:</span>
          <span>{formatRupee(pot)}</span>
          <span className="text-zinc-500">({stacks.map((s) => `${s.count}x ${s.type}`).join(', ')})</span>
        </div>
      )}
    </div>
  );
};
