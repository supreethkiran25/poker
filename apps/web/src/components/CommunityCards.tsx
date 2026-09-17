import React, { useEffect, useRef } from 'react';
import type { Card, GamePhase } from '@poker/shared';
import { CardView } from './CardView.js';
import { soundManager } from '../audio/sound-manager.js';

interface CommunityCardsProps {
  cards: Card[];
  phase: GamePhase;
  winningCards?: Card[];
  compact?: boolean;
  ultraCompact?: boolean;
}

export const CommunityCards: React.FC<CommunityCardsProps> = ({
  cards,
  phase,
  winningCards,
  compact = false,
  ultraCompact = false,
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
    <div className={`flex items-center ${ultraCompact ? 'gap-0.5' : compact ? 'gap-1' : 'gap-1.5 sm:gap-2'}`}>
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
              size={ultraCompact ? 'xs' : compact ? 'sm' : 'md'}
              dealDelayMs={delayMs}
              isHighlighted={isWinningCard}
              isDimmed={isDimmed}
            />
          );
        }

        // Luxury card placement slot on felt
        const slotLabels = ['FLOP', 'FLOP', 'FLOP', 'TURN', 'RIVER'];
        const slotSuits = ['♠', '♥', '♦', '♣', '♠'];
        return (
          <div
            key={idx}
            className={`${
              ultraCompact ? 'w-[32px] h-[46px] rounded-[4px]' : compact ? 'w-[46px] h-[66px] rounded-[5px]' : 'w-[64px] h-[92px] rounded-[6px]'
            } border border-amber-500/30 flex flex-col items-center justify-center transition-all bg-[#04190e]/60 backdrop-blur-sm shadow-inner relative group`}
            style={{
              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6), 0 1px 2px rgba(251,191,36,0.1)',
            }}
          >
            <span
              className="font-serif select-none"
              style={{
                color: idx === 1 || idx === 2 ? 'rgba(244,63,94,0.45)' : 'rgba(251,191,36,0.45)',
                fontSize: ultraCompact ? '10px' : compact ? '14px' : '18px',
              }}
            >
              {slotSuits[idx]}
            </span>
            {!ultraCompact && (
              <span
                className="text-[8px] font-mono font-bold tracking-widest uppercase mt-0.5"
                style={{ color: 'rgba(251, 191, 36, 0.4)' }}
              >
                {slotLabels[idx]}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
