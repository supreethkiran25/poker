import React from 'react';
import type { Card, GamePhase } from '@poker/shared';
import { CardView } from './CardView.js';

interface CommunityCardsProps {
  cards: Card[];
  phase: GamePhase;
}

export const CommunityCards: React.FC<CommunityCardsProps> = ({ cards, phase }) => {
  return (
    <div className="flex flex-col items-center justify-center">
      {/* Cards container */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Render up to 5 card slots */}
        {[0, 1, 2, 3, 4].map((idx) => {
          const card = cards[idx];
          if (card) {
            return <CardView key={card.id || idx} card={card} size="md" />;
          }

          // Empty card placeholder outline
          return (
            <div
              key={idx}
              className="w-14 h-20 rounded-md border border-dashed border-emerald-900/60 bg-black/10 flex items-center justify-center"
            >
              <span className="text-emerald-800/40 text-xs font-mono">♠</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
