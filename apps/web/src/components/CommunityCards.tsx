import React from 'react';
import type { Card, GamePhase } from '@poker/shared';
import { CardView } from './CardView.js';

interface CommunityCardsProps {
  cards: Card[];
  phase: GamePhase;
}

export const CommunityCards: React.FC<CommunityCardsProps> = ({ cards, phase }) => {
  const isWaiting = phase === 'WAITING_FOR_PLAYERS' || phase === 'STARTING';

  if (isWaiting) return null;

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {[0, 1, 2, 3, 4].map((idx) => {
        const card = cards[idx];
        if (card) {
          return <CardView key={(card as any).id || idx} card={card} size="md" />;
        }
        // Empty slot — show a faint placeholder
        return (
          <div
            key={idx}
            className="w-14 h-[84px] rounded-lg border border-dashed flex items-center justify-center"
            style={{ borderColor: 'rgba(6,95,70,0.4)', background: 'rgba(0,0,0,0.08)' }}
          >
            <span style={{ color: 'rgba(6,95,70,0.3)', fontSize: '14px' }}>♠</span>
          </div>
        );
      })}
    </div>
  );
};
