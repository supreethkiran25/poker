import React from 'react';
import type { PlayerPublicState } from '@poker/shared';
import { formatRupee } from '@poker/shared';
import { CardView } from './CardView.js';
import { ChipStack } from './ChipStack.js';

interface PlayerSeatProps {
  player: PlayerPublicState;
  isMe: boolean;
  dealerSeat: number;
  smallBlindSeat: number;
  bigBlindSeat: number;
  positionClass?: string;
  turnDuration?: number;
}

export const PlayerSeat: React.FC<PlayerSeatProps> = ({
  player,
  isMe,
  dealerSeat,
  smallBlindSeat,
  bigBlindSeat,
}) => {
  const isDealer = player.seatIndex === dealerSeat;
  const isSB = player.seatIndex === smallBlindSeat;
  const isBB = player.seatIndex === bigBlindSeat;

  return (
    <div
      className={`flex flex-col items-center select-none transition-all duration-300 ${
        player.hasFolded ? 'opacity-40 grayscale-[40%]' : 'opacity-100'
      }`}
      style={{ minWidth: 0 }}
    >
      {/* Current bet chip stack */}
      {player.currentBet > 0 && (
        <div className="mb-1 z-20">
          <ChipStack amount={player.currentBet} size="sm" />
        </div>
      )}

      {/* Main seat badge */}
      <div
        className={`relative flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-zinc-900/95 backdrop-blur-md border ${
          player.isTurn
            ? 'border-yellow-400 ring-2 ring-yellow-400/50 active-player-glow'
            : isMe
            ? 'border-emerald-500/80 ring-1 ring-emerald-500/30'
            : 'border-zinc-700/80'
        } shadow-2xl`}
        style={{ minWidth: '100px', maxWidth: '148px' }}
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-amber-600 via-amber-700 to-yellow-500 p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-[11px] sm:text-sm font-bold text-amber-300">
              {player.name.slice(0, 2).toUpperCase()}
            </div>
          </div>
          {/* Connection dot */}
          <div className="absolute -bottom-0.5 -right-0.5">
            {player.isConnected ? (
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-zinc-900" />
              </span>
            ) : (
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-zinc-900" title="Disconnected" />
            )}
          </div>
        </div>

        {/* Player info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 min-w-0">
            <span className="font-semibold text-[11px] sm:text-xs text-zinc-100 truncate leading-none">
              {player.name}
            </span>
            {isMe && (
              <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1 rounded font-mono font-bold flex-shrink-0">
                YOU
              </span>
            )}
          </div>
          <div className="mt-0.5">
            <span className="text-[10px] sm:text-[11px] text-amber-300 font-mono font-bold leading-none">
              {formatRupee(player.chips)}
            </span>
          </div>
        </div>

        {/* Position badges: D / SB / BB */}
        {isDealer && (
          <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white text-zinc-900 font-black text-[10px] flex items-center justify-center shadow-lg border border-zinc-300 z-10">
            D
          </div>
        )}
        {!isDealer && isSB && (
          <div className="absolute -top-2 -right-2 px-1 py-0.5 rounded-full bg-blue-600 text-white font-black text-[9px] flex items-center justify-center shadow-lg border border-blue-400 z-10">
            SB
          </div>
        )}
        {!isDealer && isBB && (
          <div className="absolute -top-2 -right-2 px-1 py-0.5 rounded-full bg-purple-600 text-white font-black text-[9px] flex items-center justify-center shadow-lg border border-purple-400 z-10">
            BB
          </div>
        )}

        {/* All-in badge */}
        {player.isAllIn && (
          <div className="absolute -top-2 left-2 px-1.5 py-0.5 rounded-full bg-red-600 text-white font-black text-[9px] flex items-center justify-center shadow-md animate-pulse z-10">
            ALL-IN
          </div>
        )}
      </div>

      {/* Opponent hole cards (face down or showdown) */}
      {!isMe && player.holeCards && player.holeCards.length > 0 && !player.hasFolded && (
        <div className="flex items-center -space-x-3 mt-1 scale-75 sm:scale-90 origin-top">
          {player.holeCards.map((c, i) => (
            <CardView key={i} card={c} size="sm" />
          ))}
        </div>
      )}

      {/* Last action pill */}
      {player.lastAction && (
        <div className="mt-1 px-1.5 py-0.5 bg-black/80 rounded-full border border-zinc-700 text-[9px] sm:text-[10px] font-mono text-zinc-300 uppercase tracking-wider whitespace-nowrap">
          {player.lastAction.type}
          {player.lastAction.amount ? ` ${formatRupee(player.lastAction.amount)}` : ''}
        </div>
      )}
    </div>
  );
};
