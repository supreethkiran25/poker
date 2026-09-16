import React, { useEffect, useRef } from 'react';
import type { Card, GamePhase } from '@poker/shared';
import { CardView } from './CardView.js';
import { soundManager } from '../audio/sound-manager.js';

interface CommunityCardsProps {
  cards: Card[];
  phase: GamePhase;
  winningCards?: Card[];
  compact?: boolean;
}

export const CommunityCards: React.FC<CommunityCardsProps> = ({
  cards,
  phase,
  winningCards,
  compact = false,
}) => {
  const prevCardCountRef = useRef(cards.length);
  const isWaiting = phase === 'WAITING_FOR_PLAYERS' || phase === 'STARTING';
  const isHandComplete = phase === 'HAND_COMPLETE';
  const hasWinningCards = isHandComplete && winningCards && winningCards.length > 0;

  useEffect(() => {
    if (cards.length > prevCardCountRef.current) {
      soundManager.playCardDeal();
    }
    prevCardCountRef.current = cards.length;
  }, [cards.length]);

  if (isWaiting) return null;

  return (
    <div className={`flex items-center ${compact ? 'gap-1' : 'gap-1.5 sm:gap-2'}`}>
      {[0, 1, 2, 3, 4].map((idx) => {
        const card = cards[idx];
        if (card) {
          // Staggered cinematic animation delay (Flop cards deal 0ms, 120ms, 240ms)
          const delayMs = idx < 3 ? idx * 110 : 0;

          const isWinningCard = hasWinningCards
            ? winningCards.some((wc) => wc.suit === card.suit && wc.rank === card.rank)
            : false;
          const isDimmed = hasWinningCards ? !isWinningCard : false;

          return (
            <CardView
              key={(card as any).id || idx}
              card={card}
              size={compact ? 'sm' : 'md'}
              dealDelayMs={delayMs}
              isHighlighted={isWinningCard}
              isDimmed={isDimmed}
            />
          );
        }

        // Empty card placeholder slot on felt
        return (
          <div
            key={idx}
            className={`${
              compact ? 'w-9 h-[54px] rounded-lg' : 'w-14 h-[84px] rounded-xl'
            } border border-dashed flex items-center justify-center transition-opacity opacity-40`}
            style={{
              borderColor: 'rgba(212, 175, 55, 0.3)',
              background: 'radial-gradient(circle, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.05) 100%)',
            }}
          >
            <span style={{ color: 'rgba(212, 175, 55, 0.4)', fontSize: compact ? '10px' : '14px' }}>♠</span>
          </div>
        );
      })}
    </div>
  );
};
