import React, { useEffect } from 'react';
import type { HandResult, PlayerPublicState } from '@poker/shared';
import { formatRupee, VIRTUAL_CURRENCY_DISCLAIMER } from '@poker/shared';
import confetti from 'canvas-confetti';
import { CardView } from './CardView.js';
import { Trophy, Shield } from 'lucide-react';

interface ShowdownBannerProps {
  result: HandResult;
  players: PlayerPublicState[];
  myPlayerId: string;
}

export const ShowdownBanner: React.FC<ShowdownBannerProps> = ({
  result,
  players,
  myPlayerId,
}) => {
  const isMeWinner = result.winners.some((w) => w.playerId === myPlayerId);

  useEffect(() => {
    if (isMeWinner) {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#d4af37', '#f3e5ab', '#10b981', '#ffffff'],
      });
    }
  }, [isMeWinner]);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border-2 border-amber-400/80 rounded-3xl p-6 shadow-2xl max-w-lg w-full flex flex-col items-center text-center">
        {/* Trophy icon */}
        <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 mb-2 shadow-lg">
          <Trophy className="w-7 h-7 animate-bounce" />
        </div>

        {/* Winners announcements */}
        {result.winners.map((winner, idx) => {
          const p = players.find((pl) => pl.id === winner.playerId);
          const isYou = winner.playerId === myPlayerId;
          const newStack = p ? p.chips : 0;

          return (
            <div key={idx} className="flex flex-col items-center mb-3">
              <span className="text-xs uppercase tracking-widest text-amber-400/90 font-mono font-bold">
                {isYou ? '🏆 YOU WON!' : `🏆 ${p?.name || 'Player'} WINS`}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-0.5">
                {formatRupee(winner.amount)}
              </h2>
              <div className="text-sm font-semibold text-amber-200 mt-0.5">
                {winner.handName}
              </div>

              {/* New Stack */}
              <div className="mt-2 px-4 py-1 bg-amber-500/10 rounded-full border border-amber-400/30 text-amber-300 font-mono text-xs font-bold">
                New Virtual Stack: {formatRupee(newStack)}
              </div>

              {/* Show winning cards if present */}
              {winner.winningCards && winner.winningCards.length > 0 && (
                <div className="flex items-center gap-1.5 mt-3">
                  {winner.winningCards.map((c, i) => (
                    <CardView key={i} card={c} size="sm" isHighlighted />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Responsible Disclaimer */}
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono">
          <Shield className="w-3 h-3 text-amber-400" />
          <span>{VIRTUAL_CURRENCY_DISCLAIMER}</span>
        </div>

        <div className="mt-3 text-xs text-zinc-500 font-mono animate-pulse">
          Next hand starting automatically...
        </div>
      </div>
    </div>
  );
};
