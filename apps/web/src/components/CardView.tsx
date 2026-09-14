import React from 'react';
import type { Card, HoleCardItem } from '@poker/shared';

interface CardViewProps {
  card?: HoleCardItem;
  size?: 'sm' | 'md' | 'lg';
  isHighlighted?: boolean;
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
    card: 'w-9 h-[52px] rounded',
    index: 'text-[9px]',
    suit: 'text-[8px]',
    center: 'text-lg',
    padding: 'p-0.5',
  },
  md: {
    card: 'w-14 h-[84px] rounded-lg',
    index: 'text-xs',
    suit: 'text-[10px]',
    center: 'text-2xl',
    padding: 'p-1',
  },
  lg: {
    card: 'w-[72px] h-[104px] rounded-xl',
    index: 'text-sm',
    suit: 'text-[11px]',
    center: 'text-3xl',
    padding: 'p-1.5',
  },
};

export const CardView: React.FC<CardViewProps> = ({
  card,
  size = 'md',
  isHighlighted = false,
}) => {
  const s = SIZE_STYLES[size];

  // Face-down / hidden card
  if (!card || 'hidden' in card) {
    return (
      <div
        className={`${s.card} relative select-none overflow-hidden card-shadow`}
        style={{
          background: 'linear-gradient(135deg, #7c2d12 0%, #991b1b 40%, #7c2d12 100%)',
          border: '1.5px solid rgba(212,175,55,0.35)',
        }}
      >
        {/* Card back pattern */}
        <div
          className="absolute inset-[3px] rounded flex items-center justify-center"
          style={{
            background: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 2px, transparent 2px, transparent 6px)',
            border: '1px solid rgba(212,175,55,0.2)',
          }}
        >
          <span style={{ fontSize: '0.7em', color: 'rgba(212,175,55,0.5)', fontWeight: 900 }}>♠</span>
        </div>
      </div>
    );
  }

  const isRed = card.suit === 'h' || card.suit === 'd';
  const suitChar = SUIT_SYMBOLS[card.suit] || card.suit;
  const rankStr = RANK_LABELS[card.rank] || String(card.rank);
  const color = isRed ? '#dc2626' : '#111827';

  return (
    <div
      className={`${s.card} ${s.padding} relative bg-white select-none card-shadow card-deal-anim flex flex-col justify-between ${
        isHighlighted
          ? 'ring-2 ring-amber-400 scale-105'
          : ''
      }`}
      style={{
        border: isHighlighted ? '1.5px solid #fbbf24' : '1.5px solid #d1d5db',
      }}
    >
      {/* Top-left rank+suit */}
      <div className="flex flex-col items-start leading-none" style={{ color }}>
        <span className={`${s.index} font-black leading-none`}>{rankStr}</span>
        <span className={`${s.suit} font-bold leading-none -mt-0.5`}>{suitChar}</span>
      </div>

      {/* Center suit */}
      <div className={`absolute inset-0 flex items-center justify-center ${s.center} pointer-events-none`} style={{ color }}>
        {suitChar}
      </div>

      {/* Bottom-right rank+suit (rotated) */}
      <div className="flex flex-col items-end leading-none rotate-180" style={{ color }}>
        <span className={`${s.index} font-black leading-none`}>{rankStr}</span>
        <span className={`${s.suit} font-bold leading-none -mt-0.5`}>{suitChar}</span>
      </div>
    </div>
  );
};
