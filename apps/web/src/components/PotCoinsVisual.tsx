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
      {/* ── Felt Contact Ambient Shadow ── */}
      <div
        className="absolute -bottom-1 w-36 sm:w-48 h-8 bg-black/65 rounded-full blur-md pointer-events-none"
        style={{ transform: 'translateY(3px)' }}
      />

      {/* ── 3D Piled Chip Stacks & Shiny Gold Coins (Clear & Fully Visible Above Plaque) ── */}
      <div className="relative flex items-end justify-center gap-1.5 sm:gap-2.5 px-3 pt-2 pb-0.5 mb-1.5 z-20 transition-transform duration-200 group-hover:scale-105 active:scale-95 cursor-pointer">
        {/* Left gleaming 3D gold coin */}
        <div className="relative -mr-1 z-30 mb-0.5 transition-transform hover:scale-110">
          <GoldCoin3D sizePx={coinLeftSize} tiltDeg={-22} />
        </div>

        {/* Dynamic Vertical 3D Clay Chip Stacks */}
        {stacks.map((stk, stackIdx) => {
          const lateralOffset = stackIdx % 2 === 0 ? '-translate-y-0.5' : 'translate-y-0.5';
          return (
            <div
              key={stackIdx}
              className={`flex flex-col items-center relative z-20 ${lateralOffset}`}
            >
              <CasinoChipStack3D
                color={stk.type}
                count={stk.count}
                sizePx={chipSize}
                className="transition-transform hover:-translate-y-1 duration-150"
              />
            </div>
          );
        })}

        {/* Center / Front resting 3D gold coin */}
        <div className="relative -mx-1.5 z-30 mb-1 transition-transform hover:scale-110">
          <GoldCoin3D sizePx={coinCenterSize} tiltDeg={-4} />
        </div>

        {/* Right gleaming 3D gold coin */}
        <div className="relative -ml-1 z-30 mb-0.5 transition-transform hover:scale-110">
          <GoldCoin3D sizePx={coinRightSize} tiltDeg={18} />
        </div>
      </div>

      {/* ── Pot Plaque (Rupee Amount Badge Sitting Cleanly Below Coins) ── */}
      {showPlaque && (
        <div className="relative z-30 flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-zinc-950/95 via-amber-950/60 to-zinc-950/95 backdrop-blur-xl px-3.5 py-0.5 sm:py-1 rounded-full border border-amber-400/60 shadow-[0_4px_22px_rgba(0,0,0,0.85),0_0_14px_rgba(245,158,11,0.25)] transition-all group-hover:border-amber-400">
          {/* Gleaming micro 3D coin icon */}
          <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-200 to-amber-600 flex items-center justify-center text-[9px] shadow-sm border border-amber-100/90 text-zinc-950 font-black shrink-0 animate-pulse">
            ₹
          </div>

          <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.18em] text-amber-400/90 font-mono font-bold">
            POT
          </span>

          <span className="text-amber-500/40 font-mono text-[10px]">•</span>

          <span className="text-xs sm:text-sm font-black text-amber-300 font-mono tracking-tight drop-shadow-[0_1px_4px_rgba(245,158,11,0.4)]">
            {formatRupee(pot)}
          </span>

          {/* Integrated Phase badge */}
          {phase && phase !== 'HAND_COMPLETE' && phase !== 'WAITING_FOR_PLAYERS' && phase !== 'STARTING' && (
            <>
              <span className="text-emerald-500/50 font-mono text-[10px] hidden sm:inline">•</span>
              <span className="text-[8.5px] font-mono uppercase tracking-wider text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/30 hidden sm:inline">
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
