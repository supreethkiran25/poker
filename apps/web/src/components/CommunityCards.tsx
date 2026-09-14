import React, { useEffect, useRef } from 'react';
import type { Card, GamePhase } from '@poker/shared';
import { CardView } from './CardView.js';
import { soundManager } from '../audio/sound-manager.js';

interface CommunityCardsProps {
  cards: Card[];
  phase: GamePhase;
}

export const CommunityCards: React.FC<CommunityCardsProps> = ({ cards, phase }) => {
  const prevCardCountRef = useRef(cards.length);
  const isWaiting = phase === 'WAITING_FOR_PLAYERS' || phase === 'STARTING';

  useEffect(() => {
    if (cards.length > prevCardCountRef.current) {
      soundManager.playCardDeal();
    }
    prevCardCountRef.current = cards.length;
  }, [cards.length]);

  if (isWaiting) return null;

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {[0, 1, 2, 3, 4].map((idx) => {
        const card = cards[idx];
        if (card) {
          // Staggered cinematic animation delay (Flop cards deal 0ms, 120ms, 240ms)
          const delayMs = idx < 3 ? idx * 110 : 0;

          return (
            <CardView
              key={(card as any).id || idx}
              card={card}
              size="md"
              dealDelayMs={delayMs}
            />
          );
        }

        // Empty card placeholder slot on felt
        return (
          <div
            key={idx}
            className="w-14 h-[84px] rounded-xl border border-dashed flex items-center justify-center transition-opacity opacity-40"
            style={{
              borderColor: 'rgba(212, 175, 55, 0.3)',
              background: 'radial-gradient(circle, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.05) 100%)',
            }}
          >
            <span style={{ color: 'rgba(212, 175, 55, 0.4)', fontSize: '14px' }}>♠</span>
          </div>
        );
      })}
    </div>
  );
};
