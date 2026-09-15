import React, { useEffect, useState } from 'react';
import {
  X,
  ArrowLeft,
  History,
  Shield,
  ArrowUpRight,
  Trophy,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
} from 'lucide-react';
import { CardView } from './CardView.js';
import { formatRupee, VIRTUAL_CURRENCY_DISCLAIMER } from '@poker/shared';
import type { Card } from '@poker/shared';

interface HandHistoryModalProps {
  roomCode: string;
  onClose: () => void;
}

export const HandHistoryModal: React.FC<HandHistoryModalProps> = ({
  roomCode,
  onClose,
}) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'recent' | 'all'>('recent');
  const [expandedHands, setExpandedHands] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const serverUrl = import.meta.env.VITE_SERVER_URL || '';
    fetch(`${serverUrl}/api/rooms/${roomCode}/history`)
      .then((res) => res.json())
      .then((data) => {
        setHistory(data.history || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [roomCode]);

  const displayedHistory = activeTab === 'recent' ? history.slice(0, 8) : history;

  const toggleExpand = (handId: string) => {
    setExpandedHands((prev) => ({
      ...prev,
      [handId]: !prev[handId],
    }));
  };

  const formatDate = (isoString?: string | number) => {
    if (!isoString) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    try {
      const d = new Date(isoString);
      return (
        d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) +
        ' ' +
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    } catch {
      return '';
    }
  };

  /**
   * Explains how the player won using official Texas Hold'em rules.
   */
  const getHandExplanation = (
    handName: string,
    holeCards?: Card[],
    winningCards?: Card[],
    communityCards?: Card[]
  ) => {
    if (!handName) return 'Hand completed.';
    if (
      handName.toLowerCase().includes('default') ||
      handName.toLowerCase().includes('folded')
    ) {
      return 'Opponents folded before showdown. Pot won uncontested.';
    }

    if (holeCards && winningCards && holeCards.length > 0 && winningCards.length > 0) {
      const pocketUsedCount = winningCards.filter((wc) =>
        holeCards.some((hc) => hc.rank === wc.rank && hc.suit === wc.suit)
      ).length;
      const boardUsedCount = winningCards.length - pocketUsedCount;

      if (pocketUsedCount === 2) {
        return `Uses both pocket cards + ${boardUsedCount} cards from the river board.`;
      }
      if (pocketUsedCount === 1) {
        return `Uses 1 pocket card + ${boardUsedCount} cards from the river board.`;
      }
      if (pocketUsedCount === 0) {
        return `Plays the board! Uses all 5 community cards from the river.`;
      }
    }

    return `Official hand rank: ${handName}.`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2.5 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-4 sm:p-6 max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh]">
        {/* Top Header with Back button & Title */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-bold text-zinc-300 hover:text-white transition active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-2 text-white font-bold">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <History className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-tight leading-none">Hand History</h3>
                <span className="text-[10px] text-zinc-500 font-mono">Texas Hold'em Official Rules</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Tabs: Recent / All */}
        <div className="flex bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 my-3 flex-shrink-0">
          <button
            onClick={() => setActiveTab('recent')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'recent'
                ? 'bg-amber-500 text-zinc-950 shadow font-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Recent Hands</span>
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-amber-500 text-zinc-950 shadow font-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Session Hands</span>
          </button>
        </div>

        {/* Disclaimer */}
        <div className="mb-2.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300/90 font-mono flex items-center gap-1.5 flex-shrink-0">
          <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{VIRTUAL_CURRENCY_DISCLAIMER}</span>
        </div>

        {/* History Cards List */}
        <div className="flex-1 overflow-y-auto py-1 space-y-3.5 pr-1">
          {loading ? (
            <div className="text-center text-zinc-500 py-12 font-mono text-xs">
              Loading verified hand history...
            </div>
          ) : displayedHistory.length === 0 ? (
            <div className="text-center text-zinc-500 py-12 font-mono text-xs">
              No hands completed yet in this session.
            </div>
          ) : (
            displayedHistory.map((hand) => {
              const primaryWinner = hand.winners?.[0];
              const winnerName = primaryWinner?.playerName || primaryWinner?.name || 'Player';
              const handDesc = primaryWinner?.handName || 'High Card';
              const potAmount = hand.total_pot || primaryWinner?.amount || 0;
              const holeCards: Card[] = primaryWinner?.holeCards || [];
              const winningCards: Card[] = primaryWinner?.winningCards || [];
              const communityCards: Card[] = hand.community_cards || [];
              const showdownHands: any[] = hand.showdown_hands || [];
              const opponentsAtShowdown = showdownHands.filter(
                (sh) => sh.playerId !== primaryWinner?.playerId
              );

              const isExpanded = !!expandedHands[hand.id];
              const explanation = getHandExplanation(
                handDesc,
                holeCards,
                winningCards,
                communityCards
              );

              return (
                <div
                  key={hand.id}
                  className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700/90 transition shadow-lg flex flex-col gap-2.5"
                >
                  {/* Top Bar: Hand Number & Timestamp */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 border-b border-zinc-800/60 pb-2">
                    <span className="flex items-center gap-1.5 font-bold text-amber-400">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      Hand #{hand.hand_number || hand.id?.slice(0, 6)}
                    </span>
                    <span>{formatDate(hand.created_at)}</span>
                  </div>

                  {/* Main Winner Banner */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0">
                        <Trophy className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-black text-white truncate">
                          Won by <span className="text-amber-300">{winnerName}</span>
                        </div>
                        <div className="text-xs font-bold text-amber-200/90 font-mono truncate">
                          {handDesc}
                        </div>
                      </div>
                    </div>

                    <div className="text-base sm:text-lg font-black font-mono text-emerald-400 shrink-0">
                      +{formatRupee(potAmount)}
                    </div>
                  </div>

                  {/* Plain English Poker Rule Explanation */}
                  <div className="px-2.5 py-1.5 rounded-xl bg-black/40 border border-zinc-800/80 text-[11px] text-zinc-300 font-mono flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span>{explanation}</span>
                  </div>

                  {/* ════ CARD CLARITY BREAKDOWN ════ */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {/* 1. What They Had (Pocket Hole Cards) */}
                    {holeCards && holeCards.length > 0 ? (
                      <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                          <span>Pocket (What they had)</span>
                          <span className="text-zinc-500">2 Cards</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {holeCards.map((c, i) => (
                            <CardView key={i} card={c} size="sm" />
                          ))}
                        </div>
                      </div>
                    ) : (
                      /* Older recorded hand fallback */
                      <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex flex-col gap-1.5">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                          Pocket Cards
                        </span>
                        <span className="text-xs text-zinc-500 font-mono">
                          Mucked / Concealed in past hand
                        </span>
                      </div>
                    )}

                    {/* 2. Winning 5-Card Hand (Golden Highlight) */}
                    {winningCards && winningCards.length > 0 ? (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300">
                          <span>Winning 5 Hand</span>
                          <span className="text-amber-400/80">Best 5</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {winningCards.map((c, i) => (
                            <CardView key={i} card={c} size="sm" isHighlighted />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex flex-col gap-1.5">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                          Winning 5 Hand
                        </span>
                        <span className="text-xs text-zinc-500 font-mono">
                          Won uncontested
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 3. Community Board / River */}
                  {communityCards && communityCards.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                        <span>River Board (Community Cards)</span>
                        <span className="text-amber-400">{communityCards.length} on board</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {communityCards.map((c, i) => (
                          <CardView key={i} card={c} size="sm" />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4. Opponents Revealed at Showdown (Expandable) */}
                  {opponentsAtShowdown.length > 0 && (
                    <div className="border-t border-zinc-800/60 pt-2 mt-0.5">
                      <button
                        onClick={() => toggleExpand(hand.id)}
                        className="w-full flex items-center justify-between text-xs text-zinc-400 hover:text-white font-mono transition py-1"
                      >
                        <span className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-amber-400" />
                          <span>
                            Show {opponentsAtShowdown.length} Opponent Hand
                            {opponentsAtShowdown.length > 1 ? 's' : ''} at Showdown
                          </span>
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-zinc-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-zinc-400" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-zinc-900 animate-fade-in">
                          {opponentsAtShowdown.map((opp, oIdx) => (
                            <div
                              key={oIdx}
                              className="p-2 rounded-xl bg-black/40 border border-zinc-800/80 flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-zinc-200 block truncate">
                                  {opp.playerName || `Player ${opp.playerId.slice(0, 4)}`}
                                </span>
                                <span className="text-[10px] text-zinc-400 font-mono block truncate">
                                  {opp.handName || opp.handRank || 'Showdown Hand'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {opp.cards && opp.cards.map((c: any, i: number) => (
                                  <CardView key={i} card={c} size="sm" />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer with Back to Table Button */}
        <div className="pt-3 border-t border-zinc-800/80 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-mono font-bold rounded-2xl border border-zinc-800 transition flex items-center justify-center gap-1.5 active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
            <span>Back to Table</span>
          </button>
        </div>
      </div>
    </div>
  );
};
