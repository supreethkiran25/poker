import React from 'react';
import { Eye, TrendingUp, Sparkles, ShieldCheck } from 'lucide-react';
import type { HandEquityResult } from '../utils/handEquityCalculator.js';

interface HandEquityBadgeProps {
  equity: HandEquityResult | null;
  className?: string;
  compact?: boolean;
}

export const HandEquityBadge: React.FC<HandEquityBadgeProps> = ({
  equity,
  className = '',
  compact = false,
}) => {
  if (!equity) return null;

  const { winPercent, handTitle, outsDescription, tier, phaseName } = equity;

  // Calibrated colors and gradients based on hand tier
  const tierConfig = {
    nuts: {
      bar: 'from-amber-400 via-yellow-300 to-amber-500',
      text: 'text-amber-300',
      border: 'border-amber-400/80',
      glow: 'shadow-[0_0_16px_rgba(251,191,36,0.45)]',
      dot: 'bg-amber-400',
    },
    strong: {
      bar: 'from-emerald-400 via-teal-400 to-emerald-500',
      text: 'text-emerald-300',
      border: 'border-emerald-500/80',
      glow: 'shadow-[0_0_14px_rgba(16,185,129,0.35)]',
      dot: 'bg-emerald-400',
    },
    good: {
      bar: 'from-sky-400 via-cyan-400 to-blue-500',
      text: 'text-sky-300',
      border: 'border-sky-500/70',
      glow: 'shadow-[0_0_12px_rgba(56,189,248,0.3)]',
      dot: 'bg-sky-400',
    },
    medium: {
      bar: 'from-amber-500 via-orange-400 to-amber-600',
      text: 'text-amber-400',
      border: 'border-amber-600/60',
      glow: 'shadow-[0_0_10px_rgba(245,158,11,0.2)]',
      dot: 'bg-amber-500',
    },
    weak: {
      bar: 'from-rose-500 via-pink-500 to-red-600',
      text: 'text-rose-400',
      border: 'border-rose-700/60',
      glow: 'shadow-[0_0_10px_rgba(244,63,94,0.2)]',
      dot: 'bg-rose-500',
    },
  }[tier];

  return (
    <div
      className={`pointer-events-auto select-none transition-all duration-200 animate-fade-in ${className}`}
      title="Live Win Probability (Private: Visible ONLY to you on this device)"
    >
      <div
        className={`flex flex-col gap-1 rounded-xl bg-zinc-950/95 backdrop-blur-xl border ${tierConfig.border} ${tierConfig.glow} px-3 py-1.5 max-w-[280px] sm:max-w-xs shadow-2xl transition-all`}
      >
        {/* Row 1: Private tag + Hand Title + Win % */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-zinc-900 border border-zinc-700/80 text-[7.5px] sm:text-[8px] font-mono text-zinc-400 uppercase tracking-wider shrink-0">
              <Eye className="w-2.5 h-2.5 text-amber-400 shrink-0" />
              <span>PRIVATE</span>
            </span>
            <span className="text-[10px] sm:text-[11px] font-sans font-bold text-zinc-100 truncate">
              {handTitle}
            </span>
          </div>

          {/* Win Percentage Callout with exact number */}
          <div className="flex items-center gap-1 shrink-0">
            <TrendingUp className={`w-3.5 h-3.5 ${tierConfig.text}`} />
            <span className={`font-mono font-black text-xs sm:text-sm tracking-tight ${tierConfig.text}`}>
              {winPercent}%
            </span>
            <span className="text-[8px] font-mono uppercase text-zinc-400">WIN</span>
          </div>
        </div>

        {/* Row 2: Precision Calibrated Progress Meter Bar with visual 25%, 50%, 75% tick marks */}
        <div className="relative w-full h-2 rounded-full bg-zinc-900/90 overflow-hidden border border-zinc-800">
          {/* Subtle tick markers for exact scale visual reference */}
          <div className="absolute inset-y-0 left-1/4 w-[1px] bg-zinc-700/40 z-10" title="25%" />
          <div className="absolute inset-y-0 left-2/4 w-[1px] bg-zinc-600/50 z-10" title="50%" />
          <div className="absolute inset-y-0 left-3/4 w-[1px] bg-zinc-700/40 z-10" title="75%" />

          {/* Dynamic Fill Bar */}
          <div
            className={`h-full rounded-full bg-gradient-to-r ${tierConfig.bar} transition-all duration-500 shadow-sm relative`}
            style={{ width: `${Math.min(100, Math.max(0, winPercent))}%` }}
          />
        </div>

        {/* Row 3: Outs Description (if any) or Phase info */}
        {outsDescription && (
          <div className="flex items-center justify-between text-[8.5px] sm:text-[9px] font-mono text-zinc-400 px-0.5">
            <span className="text-zinc-500 uppercase">{phaseName}</span>
            <span className="text-amber-300 font-medium truncate flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-amber-400 shrink-0" />
              <span>{outsDescription}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

