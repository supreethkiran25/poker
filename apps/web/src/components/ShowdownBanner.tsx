import React, { useEffect } from 'react';
import type { HandResult, PlayerPublicState } from '@poker/shared';
import { formatRupee, VIRTUAL_CURRENCY_DISCLAIMER } from '@poker/shared';
import confetti from 'canvas-confetti';
import { CardView } from './CardView.js';
import { Trophy, Shield, X, Check, Play, Coins } from 'lucide-react';

interface ShowdownBannerProps {
  result: HandResult;
  players: PlayerPublicState[];
  myPlayerId: string;
  isHost?: boolean;
  isReadyForNext?: boolean;
  readyPlayerCount?: number;
  totalActivePlayerCount?: number;
  onReadyForNext?: () => void;
  onDealNext?: () => void;
  onRebuy?: () => void;
  onClose?: () => void;
}

export const ShowdownBanner: React.FC<ShowdownBannerProps> = ({
  result,
  players,
  myPlayerId,
  isHost = false,
  isReadyForNext = false,
  readyPlayerCount = 0,
  totalActivePlayerCount = 2,
  onReadyForNext,
  onDealNext,
  onRebuy,
  onClose,
}) => {
  const isMeWinner = result.winners.some((w) => w.playerId === myPlayerId);
  const me = players.find((p) => p.id === myPlayerId);
  const amOut = me ? me.chips === 0 : false;
  const playersWithZero = players.filter((p) => p.chips === 0);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border-2 border-amber-400/80 rounded-3xl p-4 sm:p-6 shadow-2xl max-w-md w-full flex flex-col items-center text-center relative my-auto max-h-[92dvh] overflow-y-auto">
        {/* Close / View Table Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition text-xs flex items-center gap-1"
            title="View Table"
          >
            <span className="text-[10px] uppercase font-mono hidden sm:inline">View Table</span>
            <X className="w-4 h-4" />
          </button>
        )}

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
                New Stack: {formatRupee(newStack)}
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

        {/* Zero chips alert if anyone busted */}
        {playersWithZero.length > 0 && (
          <div className="my-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 font-mono w-full">
            {amOut ? (
              <span>⚠️ You have ₹0 chips! Rebuy below to deal the next hand.</span>
            ) : (
              <span>
                ⚠️ Waiting for {playersWithZero.map((p) => p.name).join(', ')} to rebuy chips.
              </span>
            )}
          </div>
        )}

        {/* ── ACTION BUTTONS INSIDE SHOWDOWN BANNER (Fixes Getting Stuck!) ── */}
        <div className="mt-4 flex flex-col sm:flex-row items-center gap-2.5 w-full">
          {amOut && onRebuy ? (
            <button
              onClick={onRebuy}
              className="w-full py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition active:scale-95 flex items-center justify-center gap-2"
            >
              <Coins className="w-4 h-4" />
              <span>Rebuy Chips to Play</span>
            </button>
          ) : (
            <>
              {/* Ready for Next Hand */}
              {onReadyForNext && (
                <button
                  onClick={onReadyForNext}
                  className={`flex-1 w-full sm:w-auto py-3 px-4 rounded-2xl font-bold text-xs uppercase tracking-wider transition active:scale-95 flex items-center justify-center gap-2 ${
                    isReadyForNext
                      ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/40'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>{isReadyForNext ? 'Ready ✓ (Waiting)' : 'Ready for Next Hand'}</span>
                </button>
              )}

              {/* Host Deal Next Hand */}
              {isHost && onDealNext && (
                <button
                  onClick={onDealNext}
                  className="flex-1 w-full sm:w-auto py-3 px-4 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-zinc-950" />
                  <span>Deal Next Hand</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* Readiness Count */}
        <div className="mt-2 text-xs font-mono text-zinc-400">
          {readyPlayerCount} of {totalActivePlayerCount} player(s) ready
        </div>

        {/* Responsible Disclaimer */}
        <div className="mt-3 flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono">
          <Shield className="w-3 h-3 text-amber-400 shrink-0" />
          <span>{VIRTUAL_CURRENCY_DISCLAIMER}</span>
        </div>
      </div>
    </div>
  );
};
