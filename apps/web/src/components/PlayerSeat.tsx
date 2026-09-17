import React, { useState, useEffect } from 'react';
import type { PlayerPublicState } from '@poker/shared';
import { formatRupee } from '@poker/shared';
import { CardView } from './CardView.js';
import { ChipStack } from './ChipStack.js';
import { Mic, MicOff, Clock } from 'lucide-react';

interface PlayerSeatProps {
  player: PlayerPublicState;
  isMe: boolean;
  dealerSeat: number;
  smallBlindSeat: number;
  bigBlindSeat: number;
  positionClass?: string;
  turnExpiresAt?: number | null;
  turnDuration?: number;
  compact?: boolean;
  isSpeaking?: boolean;
  isMuted?: boolean;
  isWinner?: boolean;
  winningCards?: any[];
  showdownHoleCards?: any[];
  isHandComplete?: boolean;
  chipPlacement?: 'top' | 'bottom' | 'none';
  onKickBot?: (botId: string) => void;
  isHost?: boolean;
}

export const PlayerSeat: React.FC<PlayerSeatProps> = ({
  player,
  isMe,
  dealerSeat,
  smallBlindSeat,
  bigBlindSeat,
  turnExpiresAt,
  turnDuration = 30,
  compact = false,
  isSpeaking = false,
  isMuted = false,
  isWinner = false,
  winningCards = [],
  showdownHoleCards,
  isHandComplete = false,
  chipPlacement = 'top',
  onKickBot,
  isHost = false,
}) => {
  const isDealer = player.seatIndex === dealerSeat;
  const isSB = player.seatIndex === smallBlindSeat;
  const isBB = player.seatIndex === bigBlindSeat;
  const [imgError, setImgError] = useState(false);

  // Compute portrait avatar URL (realistic human personas)
  const avatarUrl = React.useMemo(() => {
    if (player.avatar && (player.avatar.startsWith('http') || player.avatar.startsWith('data:'))) {
      return player.avatar;
    }
    const seed = player.avatar && player.avatar.length > 2 ? player.avatar : player.name;
    return `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
  }, [player.avatar, player.name]);

  const cardsToDisplay =
    showdownHoleCards && showdownHoleCards.length > 0 ? showdownHoleCards : player.holeCards;

  const hasWinningCard = (c: any) => {
    if (!isWinner || !winningCards || winningCards.length === 0 || !c || 'hidden' in c) return false;
    return winningCards.some((wc) => wc.suit === c.suit && wc.rank === c.rank);
  };

  // Decision timer calculation
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!player.isTurn || !turnExpiresAt) {
      setSecondsRemaining(null);
      return;
    }

    const checkTime = () => {
      const diff = Math.max(0, Math.ceil((turnExpiresAt - Date.now()) / 1000));
      setSecondsRemaining(diff);
    };

    checkTime();
    const interval = setInterval(checkTime, 250);
    return () => clearInterval(interval);
  }, [player.isTurn, turnExpiresAt]);

  const maxDuration = turnDuration || 30;
  const progressRatio =
    secondsRemaining !== null
      ? Math.max(0, Math.min(1, secondsRemaining / maxDuration))
      : 1;

  return (
    <div
      className={`relative flex flex-col items-center transition-all duration-300 select-none ${
        player.hasFolded ? 'opacity-40 grayscale-[40%]' : 'opacity-100'
      }`}
    >
      {/* Current bet chip badge above seat (for bottom half players) */}
      {player.currentBet > 0 && chipPlacement === 'top' && (
        <div className="mb-1 z-20">
          <ChipStack amount={player.currentBet} size="sm" />
        </div>
      )}

      {/* ── Seat Pod ── */}
      <div
        className={`relative flex items-center gap-2 rounded-2xl bg-zinc-950/90 backdrop-blur-md border shadow-2xl transition-all duration-300 ${
          player.isTurn
            ? 'border-amber-400 ring-2 ring-amber-400/40 active-player-glow'
            : isSpeaking
            ? 'border-emerald-400 ring-2 ring-emerald-400/50'
            : isMe
            ? 'border-emerald-500/60 ring-1 ring-emerald-500/20'
            : 'border-zinc-800'
        } ${compact ? 'px-2 py-1' : 'px-3 py-1.5'}`}
        style={{
          minWidth: compact ? '80px' : '110px',
          maxWidth: compact ? '150px' : '200px',
        }}
      >
        {/* Avatar with speaking wave, dealer button, & turn countdown ring */}
        <div className="relative flex-shrink-0 flex items-center justify-center">
          {/* Speaking glowing pulse ring */}
          {isSpeaking && (
            <span className="absolute -inset-1 rounded-full bg-emerald-500/40 animate-ping" />
          )}

          {/* Turn Countdown SVG Ring */}
          {player.isTurn && (
            <svg
              className="absolute -inset-1.5 w-[calc(100%+12px)] h-[calc(100%+12px)] -rotate-90 pointer-events-none z-20"
              viewBox="0 0 36 36"
            >
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth="2.5"
              />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke={
                  secondsRemaining !== null && secondsRemaining <= 5
                    ? '#ef4444'
                    : secondsRemaining !== null && secondsRemaining <= 10
                    ? '#f59e0b'
                    : '#10b981'
                }
                strokeWidth="2.5"
                strokeDasharray={94.2}
                strokeDashoffset={94.2 * (1 - progressRatio)}
                strokeLinecap="round"
                className="transition-all duration-200"
              />
            </svg>
          )}

          <div
            className={`relative rounded-full p-0.5 shadow-md flex items-center justify-center transition-all duration-500 overflow-hidden ${
              compact ? 'w-8 h-8 sm:w-9 sm:h-9' : 'w-10 h-10 sm:w-12 sm:h-12'
            } ${
              isWinner
                ? 'ring-4 ring-cyan-400 shadow-[0_0_24px_#00e5ff,0_0_42px_rgba(6,182,212,0.85)] scale-110 z-30 bg-cyan-400'
                : isSpeaking
                ? 'ring-2 ring-emerald-400 bg-emerald-500'
                : 'bg-gradient-to-tr from-amber-600 via-amber-700 to-yellow-500'
            }`}
          >
            {!imgError ? (
              <img
                src={avatarUrl}
                alt={player.name}
                className="w-full h-full rounded-full object-cover bg-zinc-800"
                onError={() => setImgError(true)}
              />
            ) : (
              <div
                className={`w-full h-full rounded-full bg-zinc-900 flex items-center justify-center font-black text-amber-300 ${
                  compact ? 'text-[9px]' : 'text-xs'
                }`}
              >
                {player.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          {/* Mic icon indicator */}
          {isSpeaking && (
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center shadow z-20">
              <Mic className="w-2 h-2 text-zinc-950" />
            </div>
          )}

          {/* Connection status */}
          <div className="absolute -bottom-0.5 -right-0.5 z-20">
            {player.isConnected ? (
              <span className="flex h-2 w-2 relative">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 border border-zinc-950" />
              </span>
            ) : (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 border border-zinc-950" title="Disconnected" />
            )}
          </div>
        </div>

        {/* Player name & chip balance */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 min-w-0">
            <span
              className={`font-bold text-zinc-100 truncate leading-tight ${
                compact ? 'text-[11px]' : 'text-xs'
              }`}
              title={player.name}
            >
              {player.name}
            </span>
            {isMe && (
              <span className="text-[8px] bg-emerald-500/25 text-emerald-400 px-1 py-0.5 rounded font-mono font-bold flex-shrink-0 leading-none">
                YOU
              </span>
            )}
            {player.isBot && (
              <span
                className={`text-[7.5px] px-1 py-0.5 rounded font-mono font-black flex-shrink-0 leading-none tracking-wider border ${
                  player.difficulty === 'easy'
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                    : player.difficulty === 'hard'
                    ? 'bg-rose-950/80 text-rose-300 border-rose-500/50'
                    : 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                }`}
              >
                {player.difficulty ? player.difficulty.toUpperCase() : 'BOT'}
              </span>
            )}
            {isWinner && (
              <span className="text-[8px] bg-amber-400 text-zinc-950 px-1 py-0.5 rounded font-mono font-black flex-shrink-0 leading-none shadow">
                WIN
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-1">
            <span
              className={`text-amber-300 font-mono font-bold leading-none ${
                compact ? 'text-[10px]' : 'text-[11px]'
              }`}
            >
              {formatRupee(player.chips)}
            </span>
            {player.hasFolded && (
              <span className="text-[8px] text-zinc-500 font-mono uppercase font-bold leading-none">
                • FOLD
              </span>
            )}
          </div>
        </div>

        {/* Dealer / Small Blind / Big Blind Buttons */}
        {isDealer && (
          <div
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white text-zinc-950 font-black text-[9px] flex items-center justify-center shadow-lg border border-zinc-300 z-30"
            title="Dealer Button"
          >
            D
          </div>
        )}
        {isSB && !isDealer && (
          <div
            className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-blue-600 text-white font-mono font-black text-[8px] flex items-center justify-center shadow-lg border border-blue-400 z-30"
            title="Small Blind"
          >
            SB
          </div>
        )}
        {isBB && !isDealer && (
          <div
            className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-purple-600 text-white font-mono font-black text-[8px] flex items-center justify-center shadow-lg border border-purple-400 z-30"
            title="Big Blind"
          >
            BB
          </div>
        )}

        {/* Turn Countdown Pill on Seat Pod */}
        {player.isTurn && secondsRemaining !== null && (
          <div
            className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-30 px-2 py-0.5 rounded-full text-[9px] font-mono font-black flex items-center gap-1 shadow-xl border whitespace-nowrap transition-all ${
              secondsRemaining <= 5
                ? 'bg-rose-600 border-rose-400 text-white animate-pulse ring-2 ring-rose-500/50'
                : secondsRemaining <= 10
                ? 'bg-amber-500 border-amber-300 text-zinc-950 font-black ring-1 ring-amber-400/50'
                : 'bg-zinc-950 border-emerald-400/70 text-emerald-300 ring-1 ring-emerald-500/30'
            }`}
          >
            <Clock className="w-2.5 h-2.5" />
            <span>{secondsRemaining}s</span>
          </div>
        )}
      </div>

      {/* Cards: face down during play, revealed at showdown */}
      {!isMe && cardsToDisplay && cardsToDisplay.length > 0 && (!player.hasFolded || isWinner) && (
        <div
          className={`flex items-center mt-1 transition-all duration-300 ${
            isWinner ? '-space-x-1 sm:space-x-1 scale-100 z-30' : '-space-x-4 sm:-space-x-3'
          }`}
        >
          {cardsToDisplay.map((c, i) => {
            const isWinning = hasWinningCard(c);
            const isDim = isHandComplete && !isWinning;
            return (
              <CardView
                key={i}
                card={c}
                size="sm"
                isHighlighted={isWinning}
                isDimmed={isDim}
                dealDelayMs={i * 100}
                tiltDeg={!isWinner ? (i === 0 ? -4 : 4) : 0}
              />
            );
          })}
        </div>
      )}

      {/* Current bet chip badge below seat (towards table center for top half players) */}
      {player.currentBet > 0 && chipPlacement === 'bottom' && (
        <div className="mt-1.5 z-20">
          <ChipStack amount={player.currentBet} size="sm" />
        </div>
      )}

      {/* Folded badge */}
      {player.hasFolded && (
        <div className="mt-0.5 text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
          Folded
        </div>
      )}

      {/* All-in badge */}
      {player.isAllIn && !player.hasFolded && (
        <div className="mt-0.5 text-[9px] font-mono font-bold text-rose-400 uppercase tracking-widest animate-pulse">
          ALL-IN
        </div>
      )}
    </div>
  );
};
