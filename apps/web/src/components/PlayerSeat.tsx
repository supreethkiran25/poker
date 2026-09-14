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
  positionClass = '',
}) => {
  const isDealer = player.seatIndex === dealerSeat;
  const isSB = player.seatIndex === smallBlindSeat;
  const isBB = player.seatIndex === bigBlindSeat;

  return (
    <div
      className={`absolute flex flex-col items-center select-none transition-all duration-300 ${
        player.hasFolded ? 'opacity-40 grayscale-[40%]' : 'opacity-100'
      } ${positionClass}`}
    >
      {/* Current Bet in front of seat */}
      {player.currentBet > 0 && (
        <div className="mb-1.5 transform transition-transform hover:scale-105 z-20">
          <ChipStack amount={player.currentBet} size="sm" />
        </div>
      )}

      {/* Main Seat Badge */}
      <div
        className={`relative flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-zinc-900/90 backdrop-blur-md border ${
          player.isTurn
            ? 'border-yellow-400 active-turn-ring ring-2 ring-yellow-400/50'
            : isMe
            ? 'border-emerald-500/80 ring-1 ring-emerald-500/30'
            : 'border-zinc-700/80'
        } shadow-2xl min-w-[140px] max-w-[170px]`}
      >
        {/* Avatar circle */}
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-600 via-amber-700 to-yellow-500 p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-sm font-bold text-amber-300">
              {player.name.slice(0, 2).toUpperCase()}
            </div>
          </div>

          {/* Connection indicator */}
          <div className="absolute -bottom-0.5 -right-0.5">
            {player.isConnected ? (
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-zinc-900"></span>
              </span>
            ) : (
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-zinc-900" title="Disconnected"></span>
            )}
          </div>
        </div>

        {/* Player Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-xs text-zinc-100 truncate">
              {player.name}
            </span>
            {isMe && (
              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1 py-0.2 rounded font-mono font-bold">
                YOU
              </span>
            )}
          </div>

          {/* Virtual Rupee Balance */}
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[11px] text-amber-300 font-mono font-bold tracking-tight">
              {formatRupee(player.chips)}
            </span>
          </div>
        </div>

        {/* Position Badge: Dealer / SB / BB */}
        {isDealer && (
          <div className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-white text-zinc-900 font-black text-xs flex items-center justify-center shadow-lg border border-zinc-300">
            D
          </div>
        )}
        {!isDealer && isSB && (
          <div className="absolute -top-2.5 -right-2.5 px-1.5 py-0.5 rounded-full bg-blue-600 text-white font-black text-[10px] flex items-center justify-center shadow-lg border border-blue-400">
            SB
          </div>
        )}
        {!isDealer && isBB && (
          <div className="absolute -top-2.5 -right-2.5 px-1.5 py-0.5 rounded-full bg-purple-600 text-white font-black text-[10px] flex items-center justify-center shadow-lg border border-purple-400">
            BB
          </div>
        )}

        {/* All-in indicator badge */}
        {player.isAllIn && (
          <div className="absolute -top-2.5 left-2 px-1.5 py-0.5 rounded-full bg-red-600 text-white font-black text-[9px] flex items-center justify-center shadow-md animate-pulse">
            ALL-IN
          </div>
        )}
      </div>

      {/* Hole Cards preview (for opponents who haven't folded, or during showdown) */}
      {!isMe && player.holeCards && player.holeCards.length > 0 && !player.hasFolded && (
        <div className="flex items-center -space-x-4 mt-1.5 z-10 scale-90">
          {player.holeCards.map((c, i) => (
            <CardView key={i} card={c} size="sm" />
          ))}
        </div>
      )}

      {/* Last action pill */}
      {player.lastAction && (
        <div className="mt-1 px-2 py-0.5 bg-black/80 rounded-full border border-zinc-700 text-[10px] font-mono text-zinc-300 uppercase tracking-wider">
          {player.lastAction.type}{' '}
          {player.lastAction.amount ? formatRupee(player.lastAction.amount) : ''}
        </div>
      )}
    </div>
  );
};
