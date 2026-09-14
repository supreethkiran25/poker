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
  /** compact=true for opponent pods on the oval rim */
  compact?: boolean;
}

export const PlayerSeat: React.FC<PlayerSeatProps> = ({
  player,
  isMe,
  dealerSeat,
  smallBlindSeat,
  bigBlindSeat,
  compact = false,
}) => {
  const isDealer = player.seatIndex === dealerSeat;
  const isSB = player.seatIndex === smallBlindSeat;
  const isBB = player.seatIndex === bigBlindSeat;

  return (
    <div
      className={`flex flex-col items-center transition-all duration-300 ${
        player.hasFolded ? 'opacity-35 grayscale-[50%]' : 'opacity-100'
      }`}
    >
      {/* Current bet chip above the seat */}
      {player.currentBet > 0 && (
        <div className="mb-1 z-10">
          <ChipStack amount={player.currentBet} size="sm" />
        </div>
      )}

      {/* ── Seat Badge ── */}
      <div
        className={`relative flex items-center gap-2 rounded-2xl bg-zinc-900/95 backdrop-blur-md border shadow-2xl transition-all duration-300 ${
          player.isTurn
            ? 'border-amber-400 active-player-glow'
            : isMe
            ? 'border-emerald-500/70 ring-1 ring-emerald-500/25'
            : 'border-zinc-700/70'
        } ${compact ? 'px-2 py-1.5' : 'px-3 py-2'}`}
        style={{ minWidth: compact ? '90px' : '120px', maxWidth: compact ? '140px' : '180px' }}
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div
            className={`rounded-full bg-gradient-to-tr from-amber-600 via-amber-700 to-yellow-500 p-0.5 shadow-md flex items-center justify-center ${
              compact ? 'w-7 h-7' : 'w-9 h-9'
            }`}
          >
            <div
              className={`w-full h-full rounded-full bg-zinc-900 flex items-center justify-center font-black text-amber-300 ${
                compact ? 'text-[10px]' : 'text-sm'
              }`}
            >
              {player.name.slice(0, 2).toUpperCase()}
            </div>
          </div>

          {/* Connection dot */}
          <div className="absolute -bottom-0.5 -right-0.5">
            {player.isConnected ? (
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-zinc-900" />
              </span>
            ) : (
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-zinc-900" title="Disconnected" />
            )}
          </div>
        </div>

        {/* Player details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 min-w-0">
            <span className={`font-bold text-zinc-100 truncate leading-none ${compact ? 'text-[10px]' : 'text-xs'}`}>
              {player.name}
            </span>
            {isMe && (
              <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1 rounded font-mono font-black flex-shrink-0 leading-none">
                YOU
              </span>
            )}
          </div>
          <div className="mt-0.5">
            <span className={`text-amber-300 font-mono font-bold leading-none ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
              {formatRupee(player.chips)}
            </span>
          </div>
        </div>

        {/* Position badges */}
        {isDealer && (
          <div className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-white text-zinc-900 font-black text-[10px] flex items-center justify-center shadow-lg border-2 border-zinc-300 z-10">
            D
          </div>
        )}
        {!isDealer && isSB && (
          <div className="absolute -top-2.5 -right-2.5 px-1 rounded-full bg-blue-600 text-white font-black text-[9px] flex items-center justify-center shadow-lg border border-blue-300 z-10 py-0.5">
            SB
          </div>
        )}
        {!isDealer && isBB && (
          <div className="absolute -top-2.5 -right-2.5 px-1 rounded-full bg-purple-600 text-white font-black text-[9px] flex items-center justify-center shadow-lg border border-purple-300 z-10 py-0.5">
            BB
          </div>
        )}

        {/* All-in badge */}
        {player.isAllIn && (
          <div className="absolute -top-2.5 left-2 px-1.5 rounded-full bg-rose-600 text-white font-black text-[8px] flex items-center justify-center shadow-md animate-pulse z-10 py-0.5">
            ALL·IN
          </div>
        )}
      </div>

      {/* Opponent hole cards (face-down or showdown reveal) */}
      {!isMe && player.holeCards && player.holeCards.length > 0 && !player.hasFolded && (
        <div className="flex items-center -space-x-3 mt-1 origin-top" style={{ transform: 'scale(0.75)' }}>
          {player.holeCards.map((c, i) => (
            <CardView key={i} card={c} size="sm" />
          ))}
        </div>
      )}

      {/* Last action pill */}
      {player.lastAction && (
        <div className="mt-1 px-2 py-0.5 bg-black/80 rounded-full border border-zinc-700 text-[9px] font-mono text-zinc-300 uppercase tracking-wider whitespace-nowrap">
          {player.lastAction.type}
          {player.lastAction.amount ? ` ${formatRupee(player.lastAction.amount)}` : ''}
        </div>
      )}
    </div>
  );
};
