import React, { useState, useEffect } from 'react';
import type { HandResult, PlayerPublicState } from '@poker/shared';
import { formatRupee, VIRTUAL_CURRENCY_DISCLAIMER } from '@poker/shared';
import confetti from 'canvas-confetti';
import { CardView } from './CardView.js';
import {
  Trophy,
  Shield,
  X,
  ArrowLeft,
  Check,
  Play,
  Pause,
  Coins,
  Eye,
  Layers,
  Sparkles,
  ChevronDown,
  Maximize2,
  Users,
} from 'lucide-react';

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

  // Tab: 'summary' or 'breakdown'
  const [activeTab, setActiveTab] = useState<'summary' | 'breakdown'>('summary');
  // Dock / Minimized state so user can freely inspect table felt
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  // Countdown state with pause capability
  const [countdown, setCountdown] = useState<number>(5);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Confetti trigger when hero wins
  useEffect(() => {
    if (isMeWinner) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#fbbf24', '#ffffff'],
        });
      } catch (e) {}
    }
  }, [isMeWinner]);

  // Auto-deal countdown timer
  useEffect(() => {
    if (playersWithZero.length > 0 || isPaused) return;

    const interval = setInterval(() => {
      setCountdown((prev: number) => {
        if (prev <= 1) {
          clearInterval(interval);
          // If host, auto trigger deal next
          if (isHost && onDealNext) {
            onDealNext();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [playersWithZero.length, isPaused, isHost, onDealNext]);

  const primaryWinner = result.winners[0];
  const winnerPlayer = players.find((p) => p.id === primaryWinner?.playerId);
  const isShowdown = result.showdownHands && result.showdownHands.length > 0;
  const foldedPlayers = players.filter((p) => p.hasFolded);

  // ═══════════════════════════════════════════════════════════════════════════
  // MODE 1: MINIMIZED TABLE DOCK (Floats gracefully at top/bottom of table)
  // ═══════════════════════════════════════════════════════════════════════════
  if (isMinimized) {
    return (
      <div className="fixed bottom-3 inset-x-3 sm:bottom-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto sm:max-w-2xl z-40 animate-fade-in pointer-events-auto">
        <div className="bg-zinc-950/95 backdrop-blur-xl border-2 border-amber-400/80 rounded-2xl p-2.5 sm:px-4 sm:py-2.5 shadow-2xl flex items-center justify-between gap-3 text-zinc-100">
          {/* Winner Badge & Info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-bold shrink-0">
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold truncate">
                <span className={isMeWinner ? 'text-emerald-400 font-black' : 'text-amber-300'}>
                  {isMeWinner ? 'YOU WON!' : `${winnerPlayer?.name || 'Player'} WINS`}
                </span>
                <span className="font-mono text-white font-black">
                  {formatRupee(primaryWinner?.amount || 0)}
                </span>
              </div>
              <div className="text-[10px] text-zinc-400 font-mono truncate">
                {primaryWinner?.handName || 'Hand complete'}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Auto-deal timer pill with pause */}
            {playersWithZero.length === 0 && (
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-300 hover:text-white transition"
                title={isPaused ? 'Resume auto-deal timer' : 'Pause auto-deal timer'}
              >
                {isPaused ? (
                  <>
                    <Play className="w-2.5 h-2.5 text-emerald-400" />
                    <span>Paused</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-2.5 h-2.5 text-amber-400" />
                    <span>{countdown}s</span>
                  </>
                )}
              </button>
            )}

            {/* Rebuy or Next Hand action */}
            {amOut && onRebuy ? (
              <button
                onClick={onRebuy}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl shadow transition active:scale-95 flex items-center gap-1"
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Rebuy</span>
              </button>
            ) : isHost && onDealNext ? (
              <button
                onClick={onDealNext}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl shadow transition active:scale-95 flex items-center gap-1"
              >
                <Play className="w-3.5 h-3.5 fill-zinc-950" />
                <span>Deal Next</span>
              </button>
            ) : onReadyForNext ? (
              <button
                onClick={onReadyForNext}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1 ${
                  isReadyForNext
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isReadyForNext ? 'Ready' : 'Ready?'}</span>
              </button>
            ) : null}

            {/* Expand Details button */}
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/80 transition flex items-center gap-1 text-xs"
              title="Expand Hand Details"
            >
              <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline font-mono text-[10px]">Details</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MODE 2: FULL DETAILED SHOWDOWN MODAL (Friendly, Informative & Operable)
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="bg-gradient-to-b from-[#10141f] via-zinc-950 to-zinc-950 border-2 border-amber-400/90 rounded-3xl p-4 sm:p-6 shadow-2xl max-w-lg w-full flex flex-col relative my-auto max-h-[94dvh] overflow-y-auto text-zinc-100 ring-1 ring-amber-500/20">
        {/* Top Header Bar: Title + Navigation Tabs + Minimize / Close */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 shadow">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight leading-none">
                Hand Results
              </h2>
              <span className="text-[10px] text-zinc-400 font-mono">
                {isShowdown ? 'Showdown Completed' : 'Ended by Fold'}
              </span>
            </div>
          </div>

          {/* Action buttons: Back to table felt */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsMinimized(true)}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/80 transition text-xs font-bold flex items-center gap-1.5 active:scale-95"
              title="Back to view table felt"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-bold">Back to Table</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs: Summary vs Hand Breakdown */}
        <div className="grid grid-cols-2 gap-1.5 bg-zinc-900/80 p-1 rounded-2xl border border-zinc-800 mb-4 font-mono text-xs">
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-1.5 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'summary'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Winner Summary</span>
          </button>

          <button
            onClick={() => setActiveTab('breakdown')}
            className={`py-1.5 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'breakdown'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Detailed Cards</span>
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: SUMMARY (Clean, celebratory winner spotlight)                */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'summary' && (
          <div className="flex flex-col items-center text-center">
            {/* Winner spotlight banner */}
            {result.winners.map((winner, idx) => {
              const p = players.find((pl) => pl.id === winner.playerId);
              const isYou = winner.playerId === myPlayerId;
              const newStack = p ? p.chips : 0;

              return (
                <div
                  key={idx}
                  className="w-full flex flex-col items-center p-4 rounded-2xl bg-zinc-900/60 border border-amber-500/30 shadow-inner mb-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs uppercase tracking-widest font-mono font-black px-2.5 py-0.5 rounded-full ${
                        isYou
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {isYou ? '🏆 YOU WON THE POT!' : `🏆 ${p?.name || 'Player'} WINS`}
                    </span>
                  </div>

                  {/* Big Pot Won Amount */}
                  <h2 className="text-3xl sm:text-4xl font-black text-amber-300 font-mono tracking-tight my-1 drop-shadow-md">
                    +{formatRupee(winner.amount)}
                  </h2>

                  {/* Evaluated Hand Name */}
                  <div className="text-sm font-bold text-zinc-200 mt-0.5">
                    {winner.handName}
                  </div>

                  {/* Winning 5-Card combination */}
                  {winner.winningCards && winner.winningCards.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-3 p-2 bg-black/40 rounded-2xl border border-zinc-800/80">
                      {winner.winningCards.map((c, i) => (
                        <CardView key={i} card={c} size="sm" isHighlighted />
                      ))}
                    </div>
                  )}

                  {/* New Stack badge */}
                  <div className="mt-3 px-3.5 py-1 bg-zinc-950 rounded-full border border-zinc-800 text-zinc-300 font-mono text-xs flex items-center gap-2">
                    <span className="text-zinc-500 text-[10px] uppercase">New Stack:</span>
                    <span className="font-bold text-amber-300">{formatRupee(newStack)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: DETAILED HAND BREAKDOWN (Hole cards, ranks, community, pots) */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'breakdown' && (
          <div className="flex flex-col gap-3 text-left">
            {/* 1. Community Board */}
            {result.communityCards && result.communityCards.length > 0 && (
              <div className="p-3 bg-zinc-900/60 rounded-2xl border border-zinc-800">
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold mb-2 flex items-center justify-between">
                  <span>Community Board</span>
                  <span className="text-amber-400">{result.communityCards.length} Cards</span>
                </div>
                <div className="flex items-center gap-1.5 justify-center sm:justify-start flex-wrap">
                  {result.communityCards.map((c, i) => (
                    <CardView key={i} card={c} size="sm" />
                  ))}
                </div>
              </div>
            )}

            {/* 2. Showdown Hands list */}
            {isShowdown ? (
              <div className="p-3 bg-zinc-900/60 rounded-2xl border border-zinc-800 flex flex-col gap-2.5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold flex items-center justify-between">
                  <span>Showdown Hands</span>
                  <span className="text-emerald-400">{result.showdownHands.length} Revealed</span>
                </div>

                <div className="flex flex-col gap-2">
                  {result.showdownHands.map((sh, idx) => {
                    const p = players.find((pl) => pl.id === sh.playerId);
                    const isWinner = result.winners.some((w) => w.playerId === sh.playerId);
                    const isMe = sh.playerId === myPlayerId;

                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 ${
                          isWinner
                            ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                            : 'bg-zinc-950/60 border-zinc-800/80'
                        }`}
                      >
                        {/* Player name & Hand rank */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-zinc-100 truncate">
                              {p?.name || 'Player'}
                            </span>
                            {isMe && (
                              <span className="text-[8px] font-mono font-black bg-emerald-500/20 text-emerald-400 px-1 rounded">
                                YOU
                              </span>
                            )}
                            {isWinner && (
                              <span className="text-[8px] font-mono font-black bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full border border-amber-500/40">
                                WINNER
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-amber-200/90 font-semibold mt-0.5 truncate">
                            {sh.handName}
                          </div>
                        </div>

                        {/* Revealed Hole Cards */}
                        <div className="flex items-center gap-1 shrink-0">
                          {sh.cards.map((c, i) => (
                            <CardView key={i} card={c} size="sm" isHighlighted={isWinner} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* If no showdown happened (all others folded) */
              <div className="p-3 bg-zinc-900/60 rounded-2xl border border-zinc-800 flex flex-col gap-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                  Hand Action Summary
                </div>
                <div className="text-xs text-zinc-300">
                  All opposing players folded before the showdown. The pot was awarded to{' '}
                  <strong className="text-amber-300">{winnerPlayer?.name || 'Winner'}</strong>.
                </div>
                {foldedPlayers.length > 0 && (
                  <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-zinc-500 font-mono">Folded:</span>
                    {foldedPlayers.map((fp) => (
                      <span
                        key={fp.id}
                        className="px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-zinc-400"
                      >
                        {fp.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. Pot Breakdown */}
            {result.potBreakdown && result.potBreakdown.length > 0 && (
              <div className="p-3 bg-zinc-900/60 rounded-2xl border border-zinc-800">
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold mb-1.5">
                  Pot Allocation
                </div>
                <div className="flex flex-col gap-1 text-xs font-mono">
                  {result.potBreakdown.map((pot, pIdx) => {
                    const potWinners = players
                      .filter((p) => pot.winnerIds.includes(p.id))
                      .map((p) => p.name)
                      .join(', ');

                    return (
                      <div
                        key={pIdx}
                        className="flex items-center justify-between text-zinc-300 py-1 border-b border-zinc-900 last:border-0"
                      >
                        <span>{pIdx === 0 ? 'Main Pot' : `Side Pot ${pIdx}`}</span>
                        <div className="flex items-center gap-2 font-bold">
                          <span className="text-amber-300">{formatRupee(pot.amount)}</span>
                          <span className="text-[10px] text-zinc-500 font-normal">
                            → {potWinners || 'Winner'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* FOOTER ACTIONS ZONE: Timer, Rebuy, Ready, Deal Immediately         */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="mt-4 pt-3 border-t border-zinc-800/80 flex flex-col items-center gap-2.5">
          {/* Zero chips alert if anyone busted */}
          {playersWithZero.length > 0 ? (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 font-mono w-full text-center">
              {amOut ? (
                <span>⚠️ You have ₹0 chips! Rebuy below to deal the next hand.</span>
              ) : (
                <span>
                  ⚠️ Waiting for {playersWithZero.map((p) => p.name).join(', ')} to rebuy chips.
                </span>
              )}
            </div>
          ) : (
            /* Auto-deal countdown indicator with Pause/Play button */
            <div className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs font-mono text-zinc-300 w-full flex items-center justify-between px-3">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isPaused ? 'bg-amber-400' : 'bg-emerald-400 animate-ping'
                  }`}
                />
                <span>
                  {isPaused
                    ? 'Timer paused (inspect cards)'
                    : `Dealing next hand in ${countdown}s…`}
                </span>
              </div>

              <button
                onClick={() => setIsPaused(!isPaused)}
                className="px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-mono flex items-center gap-1 transition"
                title={isPaused ? 'Resume countdown' : 'Pause countdown'}
              >
                {isPaused ? (
                  <>
                    <Play className="w-2.5 h-2.5 text-emerald-400 fill-emerald-400" />
                    <span>Resume</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-2.5 h-2.5 text-amber-400" />
                    <span>Pause</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Primary Action Button */}
          {amOut && onRebuy ? (
            <button
              onClick={onRebuy}
              className="w-full py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition active:scale-95 flex items-center justify-center gap-2"
            >
              <Coins className="w-4 h-4" />
              <span>Rebuy Chips to Play</span>
            </button>
          ) : isHost && onDealNext ? (
            <button
              onClick={onDealNext}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition active:scale-95 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-zinc-950" />
              <span>Deal Next Hand Immediately</span>
            </button>
          ) : (
            onDealNext && (
              <button
                onClick={onDealNext}
                className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-500/40 font-bold text-xs uppercase tracking-wider rounded-2xl shadow transition active:scale-95 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Ready for Next Hand ({readyPlayerCount} of {totalActivePlayerCount})</span>
              </button>
            )
          )}

          {/* Readiness count & Disclaimer */}
          <div className="flex items-center justify-between w-full text-[10px] text-zinc-500 font-mono px-1">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-zinc-400" />
              <span>
                {readyPlayerCount} / {totalActivePlayerCount} ready
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-amber-400 shrink-0" />
              <span>Virtual chips only</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
