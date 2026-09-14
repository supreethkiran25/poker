import React from 'react';
import type { Card, HoleCardItem } from '@poker/shared';

interface CardViewProps {
  card?: HoleCardItem;
  size?: 'sm' | 'md' | 'lg';
  isHighlighted?: boolean;
  dealDelayMs?: number;
  isInteractive?: boolean;
  tiltDeg?: number;
}

const SUIT_SYMBOLS: Record<string, string> = {
  s: '♠',
  h: '♥',
  d: '♦',
  c: '♣',
};

const RANK_LABELS: Record<number, string> = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6',
  7: '7', 8: '8', 9: '9', 10: '10',
  11: 'J', 12: 'Q', 13: 'K', 14: 'A',
};

const SIZE_STYLES = {
  sm: {
    card: 'w-9 h-[54px] rounded-md',
    index: 'text-[10px]',
    suit: 'text-[9px]',
    center: 'text-base',
    padding: 'p-1',
  },
  md: {
    card: 'w-14 h-[84px] rounded-xl',
    index: 'text-xs font-black',
    suit: 'text-[11px]',
    center: 'text-2xl',
    padding: 'p-1.5',
  },
  lg: {
    card: 'w-[72px] h-[106px] rounded-xl',
    index: 'text-sm font-black',
    suit: 'text-xs',
    center: 'text-3xl',
    padding: 'p-2',
  },
};

export const CardView: React.FC<CardViewProps> = ({
  card,
  size = 'md',
  isHighlighted = false,
  dealDelayMs = 0,
  isInteractive = false,
  tiltDeg = 0,
}) => {
  const s = SIZE_STYLES[size];

  // Face-down card (Opponents or hidden)
  if (!card || 'hidden' in card) {
    return (
      <div
        className={`${s.card} relative select-none overflow-hidden realistic-card-shadow card-cinematic-deal transition-transform`}
        style={{
          background: 'linear-gradient(145deg, #1a0b08 0%, #6b1414 45%, #3b0a0a 100%)',
          border: '1.5px solid rgba(212,175,55,0.4)',
          animationDelay: `${dealDelayMs}ms`,
          transform: tiltDeg ? `rotate(${tiltDeg}deg)` : undefined,
        }}
      >
        {/* Diamond guilloche pattern */}
        <div
          className="absolute inset-[3px] rounded flex items-center justify-center"
          style={{
            background:
              'radial-gradient(circle at center, rgba(212,175,55,0.15) 0%, transparent 70%), repeating-linear-gradient(45deg, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 2px, transparent 2px, transparent 6px)',
            border: '1px solid rgba(212,175,55,0.25)',
          }}
        >
          <span style={{ fontSize: '0.85em', color: '#f3e5ab', opacity: 0.7, fontWeight: 900 }}>
            ♠
          </span>
        </div>
      </div>
    );
  }

  const isRed = card.suit === 'h' || card.suit === 'd';
  const suitChar = SUIT_SYMBOLS[card.suit] || card.suit;
  const rankStr = RANK_LABELS[card.rank] || String(card.rank);
  const color = isRed ? '#dc2626' : '#0f172a';

  return (
    <div
      className={`${s.card} ${s.padding} relative bg-gradient-to-b from-white via-zinc-50 to-zinc-100 select-none realistic-card-shadow card-cinematic-deal flex flex-col justify-between ${
        isInteractive ? 'hole-card-interactive' : ''
      } ${
        isHighlighted
          ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-zinc-950 scale-105'
          : ''
      }`}
      style={{
        border: isHighlighted ? '1.5px solid #fbbf24' : '1.5px solid #cbd5e1',
        animationDelay: `${dealDelayMs}ms`,
        transform: tiltDeg && !isInteractive ? `rotate(${tiltDeg}deg)` : undefined,
      }}
    >
      {/* Top-left rank & suit index */}
      <div className="flex flex-col items-start leading-none pointer-events-none" style={{ color }}>
        <span className={`${s.index} leading-none tracking-tighter`}>{rankStr}</span>
        <span className={`${s.suit} leading-none -mt-0.5`}>{suitChar}</span>
      </div>

      {/* Center suit watermark with subtle 3D depth */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        style={{ color, opacity: 0.9 }}
      >
        <span className={`${s.center} filter drop-shadow-sm`}>{suitChar}</span>
      </div>

      {/* Bottom-right inverted rank & suit index */}
      <div
        className="flex flex-col items-end leading-none rotate-180 pointer-events-none"
        style={{ color }}
      >
        <span className={`${s.index} leading-none tracking-tighter`}>{rankStr}</span>
        <span className={`${s.suit} leading-none -mt-0.5`}>{suitChar}</span>
      </div>
    </div>
  );
};
