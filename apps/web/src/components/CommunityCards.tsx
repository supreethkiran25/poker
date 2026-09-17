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
    <div className={`flex items-center p-1 sm:p-1.5 rounded-2xl bg-black/30 backdrop-blur-sm border border-amber-500/20 shadow-[inset_0_3px_12px_rgba(0,0,0,0.7),0_0_20px_rgba(0,0,0,0.4)] ${ultraCompact ? 'gap-1' : compact ? 'gap-1.5' : 'gap-2'}`}>
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

        // Luxury velvet-inlaid card placement slot on table felt
        const slotLabels = ['FLOP', 'FLOP', 'FLOP', 'TURN', 'RIVER'];
        const slotSuits = ['♠', '♥', '♦', '♣', '♠'];
        const isRed = idx === 1 || idx === 2;

        return (
          <div
            key={idx}
            className={`${
              ultraCompact ? 'w-[32px] h-[46px] rounded-[4px]' : compact ? 'w-[46px] h-[66px] rounded-[5px]' : 'w-[64px] h-[92px] rounded-[6px]'
            } border border-dashed border-amber-400/25 flex flex-col items-center justify-between py-1.5 transition-all bg-gradient-to-b from-black/45 via-[#03150d]/50 to-black/65 shadow-[inset_0_3px_10px_rgba(0,0,0,0.85),0_1px_3px_rgba(251,191,36,0.06)] relative group select-none`}
          >
            {/* Subtle top corner accent */}
            <div className="w-full flex justify-between px-1 opacity-20">
              <span className="text-[6px] font-mono text-amber-300">•</span>
              <span className="text-[6px] font-mono text-amber-300">•</span>
            </div>

            {/* Centered metallic suit emblem */}
            <span
              className="font-serif select-none transition-transform group-hover:scale-110 drop-shadow-sm"
              style={{
                color: isRed ? 'rgba(244,63,94,0.4)' : 'rgba(251,191,36,0.35)',
                fontSize: ultraCompact ? '12px' : compact ? '16px' : '22px',
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))',
              }}
            >
              {slotSuits[idx]}
            </span>

            {/* Street label */}
            {!ultraCompact && (
              <span
                className="text-[7.5px] sm:text-[8px] font-mono font-bold tracking-[0.2em] uppercase"
                style={{ color: 'rgba(251, 191, 36, 0.45)' }}
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
