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
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'J',
  12: 'Q',
  13: 'K',
  14: 'A',
};

export const CardView: React.FC<CardViewProps> = ({
  card,
  size = 'md',
  isHighlighted = false,
}) => {
  const sizeClasses = {
    sm: 'w-9 h-13 text-xs rounded-sm',
    md: 'w-14 h-20 text-sm rounded-md',
    lg: 'w-20 h-28 text-base rounded-lg',
  }[size];

  // If no card or card is hidden
  if (!card || 'hidden' in card) {
    return (
      <div
        className={`${sizeClasses} relative bg-gradient-to-br from-red-950 via-red-900 to-amber-950 border border-amber-500/40 card-shadow flex items-center justify-center select-none overflow-hidden transform transition-transform hover:-translate-y-1`}
      >
        <div className="absolute inset-1 rounded-sm border border-dashed border-amber-400/30 flex items-center justify-center bg-black/20">
          <div className="w-5 h-5 rounded-full border border-amber-400/50 flex items-center justify-center text-[10px] text-amber-300 font-bold">
            ♠
          </div>
        </div>
      </div>
    );
  }

  const isRed = card.suit === 'h' || card.suit === 'd';
  const suitChar = SUIT_SYMBOLS[card.suit] || card.suit;
  const rankStr = RANK_LABELS[card.rank] || String(card.rank);

  return (
    <div
      className={`${sizeClasses} relative bg-white text-zinc-900 card-shadow border ${
        isHighlighted
          ? 'ring-2 ring-yellow-400 border-yellow-400 scale-105'
          : 'border-zinc-300'
      } flex flex-col justify-between p-1 select-none font-bold transform transition-transform card-deal-anim`}
    >
      {/* Top-left corner index */}
      <div className={`leading-none flex flex-col items-center ${isRed ? 'text-red-600' : 'text-zinc-900'}`}>
        <span className="text-[11px] font-black">{rankStr}</span>
        <span className="text-[10px] -mt-0.5">{suitChar}</span>
      </div>

      {/* Center suit emblem */}
      <div className={`absolute inset-0 flex items-center justify-center pointer-events-none text-2xl ${isRed ? 'text-red-600' : 'text-zinc-900'}`}>
        {suitChar}
      </div>

      {/* Bottom-right inverted index */}
      <div className={`leading-none flex flex-col items-center self-end rotate-180 ${isRed ? 'text-red-600' : 'text-zinc-900'}`}>
        <span className="text-[11px] font-black">{rankStr}</span>
        <span className="text-[10px] -mt-0.5">{suitChar}</span>
      </div>
    </div>
  );
};
