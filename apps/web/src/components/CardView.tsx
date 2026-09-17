import React from 'react';
import type { HoleCardItem } from '@poker/shared';

export interface CardViewProps {
  card?: HoleCardItem;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isHighlighted?: boolean;
  isDimmed?: boolean;
  dealDelayMs?: number;
  isInteractive?: boolean;
  tiltDeg?: number;
}

// ── Exported SuitIcon for any components needing standalone suit pips ──
export const SuitIcon: React.FC<{ suit: string; className?: string; size?: number }> = ({
  suit,
  className = '',
  size = 16,
}) => {
  switch (suit) {
    case 's':
      return (
        <svg
          viewBox="0 0 100 115"
          width={size}
          height={size}
          className={`shrink-0 ${className}`}
          fill="currentColor"
        >
          <path d="M50 6 C45 22 18 45 18 68 C18 82 30 92 44 90 C45 89 46 87 47 85 C45 92 38 102 30 109 L70 109 C62 102 55 92 53 85 C54 87 55 89 56 90 C70 92 82 82 82 68 C82 45 55 22 50 6 Z" />
        </svg>
      );
    case 'h':
      return (
        <svg
          viewBox="0 0 100 100"
          width={size}
          height={size}
          className={`shrink-0 ${className}`}
          fill="currentColor"
        >
          <path d="M50 90 C22 66 6 47 6 30 C6 14 18 4 34 4 C43 4 48 8 50 14 C52 8 57 4 66 4 C82 4 94 14 94 30 C94 47 78 66 50 90 Z" />
        </svg>
      );
    case 'd':
      return (
        <svg
          viewBox="0 0 100 100"
          width={size}
          height={size}
          className={`shrink-0 ${className}`}
          fill="currentColor"
        >
          <path d="M50 4 L94 50 L50 96 L6 50 Z" />
        </svg>
      );
    case 'c':
      return (
        <svg
          viewBox="0 0 100 115"
          width={size}
          height={size}
          className={`shrink-0 ${className}`}
          fill="currentColor"
        >
          <path d="M50 8 C40 8 32 16 32 26 C32 33 36 38 41 41 C36 41 33 41 30 41 C18 41 10 50 10 61 C10 72 19 80 30 80 C36 80 41 77 45 74 C43 79 38 90 30 98 L70 98 C62 90 57 79 55 74 C59 77 64 80 70 80 C81 80 90 72 90 61 C90 50 82 41 70 41 C67 41 64 41 59 41 C64 38 68 33 68 26 C68 16 60 8 50 8 Z" />
        </svg>
      );
    default:
      return null;
  }
};

const getRankStr = (rank: number): string => {
  if (rank === 14) return 'A';
  if (rank === 13) return 'K';
  if (rank === 12) return 'Q';
  if (rank === 11) return 'J';
  return String(rank);
};

// ── Exact Aspect Ratio (79px : 114px = 1 : 1.443) ──
const SIZE_CLASSES = {
  xs: 'w-[32px] h-[46px] rounded-[4px]',
  sm: 'w-[46px] h-[66px] rounded-[5px]',
  md: 'w-[64px] h-[92px] rounded-[6px]',
  lg: 'w-[80px] h-[115px] rounded-[7px]',
  xl: 'w-[94px] h-[135px] rounded-[8px]',
};

export const CardView: React.FC<CardViewProps> = ({
  card,
  size = 'md',
  isHighlighted = false,
  isDimmed = false,
  dealDelayMs = 0,
  isInteractive = false,
  tiltDeg = 0,
}) => {
  const isFaceDown = !card || ('hidden' in card && card.hidden === true);
  const visibleCard = card && !('hidden' in card) ? card : null;
  const rankStr = visibleCard ? getRankStr(visibleCard.rank) : '';
  const suitStr = visibleCard ? visibleCard.suit.toLowerCase() : '';
  const imageSrc = isFaceDown || !visibleCard ? '/cards/back.png' : `/cards/${rankStr}${suitStr}.png`;
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none transition-all duration-200 ${sizeClass} ${
        isHighlighted
          ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-zinc-950 shadow-xl shadow-amber-500/40 -translate-y-1 scale-105 z-20'
          : 'shadow-md shadow-black/60'
      } ${isDimmed ? 'opacity-35 grayscale filter' : ''} ${
        isInteractive ? 'cursor-pointer hover:scale-105 hover:-translate-y-1.5 active:scale-95' : ''
      }`}
      style={{
        transform: tiltDeg ? `rotate(${tiltDeg}deg)` : undefined,
        animationDelay: dealDelayMs ? `${dealDelayMs}ms` : undefined,
      }}
      title={card ? `${rankStr} of ${suitStr.toUpperCase()}` : 'Face Down Card'}
    >
      <img
        src={imageSrc}
        alt={card ? `${rankStr}${suitStr}` : 'Card Back'}
        className="w-full h-full object-fill rounded-[inherit] select-none pointer-events-none drop-shadow-sm"
        style={{
          imageRendering: 'auto',
        }}
        loading="eager"
        decoding="async"
      />
    </div>
  );
};
