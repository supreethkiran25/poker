import React, { useState, useEffect } from 'react';
import type { HandResult, PlayerPublicState } from '@poker/shared';
import { formatRupee } from '@poker/shared';
import confetti from 'canvas-confetti';
import { CardView } from './CardView.js';
import {
  Trophy,
  X,
  ArrowLeft,
  Check,
  Play,
  Pause,
  Coins,
  Layers,
  Sparkles,
  Clock,
  Maximize2,
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
  // 7-second countdown timer with smooth fade-out
  const [countdown, setCountdown] = useState<number>(7);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  // Confetti trigger when hero wins
  useEffect(() => {
    if (isMeWinner) {
      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.55 },
          colors: ['#f59e0b', '#10b981', '#fbbf24', '#ffffff'],
        });
      } catch (e) {}
    }
  }, [isMeWinner]);

  // 7-second auto-deal and smooth fade-out timer
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCountdown((prev: number) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsFadingOut(true);
          // Wait 700ms for smooth CSS fade-out animation before dismissing
          setTimeout(() => {
            if (onClose) onClose();
            if (isHost && onDealNext && playersWithZero.length === 0) {
              onDealNext();
            }
          }, 700);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, isHost, onDealNext, onClose, playersWithZero.length]);

  const primaryWinner = result.winners[0];
  const winnerPlayer = players.find((p) => p.id === primaryWinner?.playerId);
  const isShowdown = result.showdownHands && result.showdownHands.length > 0;
  const foldedPlayers = players.filter((p) => p.hasFolded);

  // ═══════════════════════════════════════════════════════════════════════════
  // MODE 1: MINIMIZED TABLE DOCK (Floats gracefully at bottom of table)
  // ═══════════════════════════════════════════════════════════════════════════
  if (isMinimized) {
    return (
      <div
        className={`fixed bottom-3 inset-x-3 sm:bottom-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto sm:max-w-2xl z-40 transition-all duration-700 ${
          isFadingOut ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100 animate-fade-in'
        } pointer-events-auto`}
      >
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

          {/* Quick Actions & 7s Timer */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-300 hover:text-white transition"
              title={isPaused ? 'Resume auto-fade timer' : 'Pause auto-fade timer'}
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
  // MODE 2: FULL WINNER SPOTLIGHT MODAL (Visible to everyone, Fades in 7s)
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 transition-all duration-700 ease-in-out ${
        isFadingOut ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100 animate-fade-in'
      } overflow-y-auto`}
    >
      <div className="bg-gradient-to-b from-[#0f1422] via-zinc-950 to-zinc-950 border-2 border-amber-400/90 rounded-3xl p-4 sm:p-6 shadow-2xl max-w-lg w-full flex flex-col relative my-auto max-h-[94dvh] overflow-y-auto text-zinc-100 ring-1 ring-amber-500/30">
        {/* Top Header Bar: Title + Navigation Tabs + Back to table / Close */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 shadow">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight leading-none">
                Hand Results
              </h2>
              <span className="text-[10px] text-zinc-400 font-mono">
                {isShowdown ? 'Showdown Completed' : 'All Opponents Folded'}
              </span>
            </div>
          </div>

          {/* Action buttons: Back to table / Dismiss */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsMinimized(true)}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/80 transition text-xs font-bold flex items-center gap-1.5 active:scale-95"
              title="Minimize to table dock"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-bold hidden sm:inline">Table</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs: Summary vs Detailed Cards */}
        <div className="grid grid-cols-2 gap-1.5 bg-zinc-900/80 p-1 rounded-2xl border border-zinc-800 mb-3 font-mono text-xs">
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-1.5 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'summary'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Winner Spotlight</span>
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
            <span>All Cards & Pots</span>
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: SUMMARY (Grand Winner Spotlight + Visible Winning Cards)     */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'summary' && (
          <div className="flex flex-col items-center text-center">
            {result.winners.map((winner, idx) => {
              const p = players.find((pl) => pl.id === winner.playerId);
              const isYou = winner.playerId === myPlayerId;
              const newStack = p ? p.chips : 0;

              return (
                <div
                  key={idx}
                  className="w-full flex flex-col items-center p-4 rounded-2xl bg-zinc-900/70 border border-amber-500/40 shadow-xl mb-3 relative overflow-hidden"
                >
                  {/* Glowing background halo */}
                  <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent pointer-events-none" />

                  <div className="flex items-center gap-2 mb-1 z-10">
                    <span
                      className={`text-xs uppercase tracking-widest font-mono font-black px-3 py-1 rounded-full shadow ${
                        isYou
                          ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 animate-pulse'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {isYou ? '🏆 YOU WON THE POT!' : `🏆 ${p?.name || 'Player'} WINS`}
                    </span>
                  </div>

                  {/* Big Pot Won Amount */}
                  <h2 className="text-3xl sm:text-4xl font-black text-amber-300 font-mono tracking-tight my-1 drop-shadow-md z-10">
                    +{formatRupee(winner.amount)}
                  </h2>

                  {/* Detail on How They Won */}
                  <div className="text-xs sm:text-sm font-bold text-amber-100/90 mt-0.5 bg-black/40 px-3 py-1 rounded-lg border border-amber-500/20 z-10 font-mono">
                    {winner.handName}
                  </div>

                  {/* Plain English Poker Rule Explanation Pill */}
                  {(() => {
                    const holeCards = winner.holeCards || (winnerPlayer?.holeCards ? (winnerPlayer.holeCards.filter(c => 'suit' in c) as any[]) : []);
                    const winningCards = winner.winningCards || [];
                    let explanation = 'Hand complete.';
                    if (
                      winner.handName.toLowerCase().includes('default') ||
                      winner.handName.toLowerCase().includes('folded')
                    ) {
                      explanation = 'All opponents folded before showdown. Won uncontested.';
                    } else if (holeCards.length > 0 && winningCards.length > 0) {
                      const pocketCount = winningCards.filter((wc) =>
                        holeCards.some((hc: any) => hc.rank === wc.rank && hc.suit === wc.suit)
                      ).length;
                      const boardCount = winningCards.length - pocketCount;
                      if (pocketCount === 2) {
                        explanation = `Uses both pocket cards + ${boardCount} cards from the river board.`;
                      } else if (pocketCount === 1) {
                        explanation = `Uses 1 pocket card + ${boardCount} cards from the river board.`;
                      } else if (pocketCount === 0) {
                        explanation = `Plays the board! Uses all 5 community cards from the river.`;
                      }
                    }

                    return (
                      <div className="mt-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-300 font-mono flex items-center gap-1.5 z-10">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>{explanation}</span>
                      </div>
                    );
                  })()}

                  {/* ── CARD BREAKDOWN: POCKET & WINNING 5 CARDS ── */}
                  <div className="w-full flex flex-col items-center gap-2.5 mt-3 z-10">
                    {/* 1. Winning 5-Card Hand (Golden Spotlight) */}
                    {winner.winningCards && winner.winningCards.length > 0 && (
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300">
                          Winning 5-Card Hand ({winner.handName})
                        </span>
                        <div className="flex items-center gap-1.5 p-2 bg-black/70 rounded-2xl border border-amber-500/40 shadow-inner">
                          {winner.winningCards.map((c, i) => (
                            <CardView key={i} card={c} size="md" isHighlighted />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 2. What they had (Pocket) vs River Board Cards */}
                    {(() => {
                      const holeCards = winner.holeCards || (winnerPlayer?.holeCards ? (winnerPlayer.holeCards.filter(c => 'suit' in c) as any[]) : []);
                      const communityCards = result.communityCards || [];

                      return (
                        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 text-left">
                          {holeCards.length > 0 && (
                            <div className="p-2 bg-black/50 rounded-xl border border-zinc-800">
                              <div className="flex items-center justify-between text-[9px] font-mono font-bold uppercase tracking-wider text-amber-400 mb-1">
                                <span>Pocket (What they had)</span>
                                <span className="text-zinc-500">2 Cards</span>
                              </div>
                              <div className="flex items-center gap-1">
                                {holeCards.map((c: any, i: number) => (
                                  <CardView key={i} card={c} size="sm" />
                                ))}
                              </div>
                            </div>
                          )}

                          {communityCards.length > 0 && (
                            <div className="p-2 bg-black/50 rounded-xl border border-zinc-800">
                              <div className="flex items-center justify-between text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1">
                                <span>River Board (In River)</span>
                                <span className="text-amber-400">{communityCards.length} Cards</span>
                              </div>
                              <div className="flex items-center gap-1 flex-wrap">
                                {communityCards.map((c: any, i: number) => (
                                  <CardView key={i} card={c} size="sm" />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* New Chip Stack */}
                  <div className="mt-3 px-3.5 py-1 bg-zinc-950 rounded-full border border-zinc-800 text-zinc-300 font-mono text-xs flex items-center gap-2 z-10">
                    <span className="text-zinc-500 text-[10px] uppercase">New Chip Stack:</span>
                    <span className="font-bold text-amber-300">{formatRupee(newStack)}</span>
                  </div>
                </div>
              );
            })}

            {/* If Showdown occurred, display contested hands below the spotlight */}
            {isShowdown && result.showdownHands.length > 1 && (
              <div className="w-full mt-1 p-3 bg-zinc-900/50 rounded-2xl border border-zinc-800/80 text-left">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block mb-2">
                  All Revealed Showdown Hands
                </span>
                <div className="flex flex-col gap-2">
                  {result.showdownHands.map((sh, idx) => {
                    const p = players.find((pl) => pl.id === sh.playerId);
                    const isWinner = result.winners.some((w) => w.playerId === sh.playerId);

                    return (
                      <div
                        key={idx}
                        className={`p-2 rounded-xl border flex items-center justify-between gap-2 ${
                          isWinner
                            ? 'bg-amber-500/10 border-amber-500/40'
                            : 'bg-black/40 border-zinc-800/70'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1 text-xs font-bold text-zinc-200 truncate">
                            <span>{p?.name || 'Player'}</span>
                            {isWinner && (
                              <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1 rounded font-mono font-bold">
                                WINNER
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-400 font-mono truncate block">
                            {sh.handName}
                          </span>
                        </div>
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
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: DETAILED BREAKDOWN (Community cards & pot allocation)       */}
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

            {/* 2. Revealed Showdown Hands list */}
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
                          <span className="text-[10px] text-zinc-400">({potWinners})</span>
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
        {/* 7-SECOND AUTO-FADE TIMER & PROGRESS BAR (Requested by user)        */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="w-full mt-3 pt-3 border-t border-zinc-800/80 flex flex-col items-center gap-2">
          {/* Animated 7s gradient progress bar */}
          <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-zinc-800/80 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 rounded-full transition-all duration-1000 ease-linear shadow-[0_0_10px_rgba(245,158,11,0.5)]"
              style={{ width: `${Math.max(0, (countdown / 7) * 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between w-full text-[11px] text-zinc-400 font-mono font-medium px-1">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{isPaused ? 'Auto-fade paused' : `Fading out in ${countdown}s`}</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="text-amber-400 hover:text-amber-300 underline font-bold transition"
              >
                {isPaused ? 'Resume' : 'Pause'}
              </button>

              {onClose && (
                <button
                  onClick={onClose}
                  className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 rounded border border-zinc-800 text-[10px] text-zinc-300 transition"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
