import React, { useEffect, useState } from 'react';
import { X, ArrowLeft, History, Shield, ArrowUpRight } from 'lucide-react';
import { CardView } from './CardView.js';
import { formatRupee, VIRTUAL_CURRENCY_DISCLAIMER } from '@poker/shared';

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

  const displayedHistory = activeTab === 'recent' ? history.slice(0, 5) : history;

  const formatDate = (isoString?: string) => {
    if (!isoString) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-4 sm:p-7 max-w-xl w-full shadow-2xl flex flex-col max-h-[88vh]">
        {/* Top Header with Back button */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-bold text-zinc-300 hover:text-white transition active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-2 text-white font-bold">
              <History className="w-4 h-4 text-amber-400" />
              <h3 className="text-base sm:text-lg">Hand History</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Tabs: Recent / All (Screen 7 Reference) */}
        <div className="flex bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 my-3 flex-shrink-0">
          <button
            onClick={() => setActiveTab('recent')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'recent'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Recent
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'all'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            All
          </button>
        </div>

        {/* Disclaimer */}
        <div className="mb-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300/90 font-mono flex items-center gap-1.5 flex-shrink-0">
          <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{VIRTUAL_CURRENCY_DISCLAIMER}</span>
        </div>

        {/* History Cards List */}
        <div className="flex-1 overflow-y-auto py-2 space-y-3">
          {loading ? (
            <div className="text-center text-zinc-500 py-10 font-mono text-xs">
              Loading hand history...
            </div>
          ) : displayedHistory.length === 0 ? (
            <div className="text-center text-zinc-500 py-10 font-mono text-xs">
              No hands completed yet in this session.
            </div>
          ) : (
            displayedHistory.map((hand) => {
              const primaryWinner = hand.winners?.[0];
              const winnerName = primaryWinner?.playerName || primaryWinner?.name || 'Player';
              const handDesc = primaryWinner?.handName || 'High Card';
              const potAmount = hand.total_pot || primaryWinner?.amount || 0;

              return (
                <div
                  key={hand.id}
                  className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition flex flex-col gap-2"
                >
                  {/* Header: Hand ID & Timestamp */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                    <span className="flex items-center gap-1 text-zinc-400 font-bold">
                      <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                      #{hand.hand_number || hand.id?.slice(0, 6)}
                    </span>
                    <span>{formatDate(hand.created_at)}</span>
                  </div>

                  {/* Main Line: Won by ... + Amount */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-white">
                      Won by <span className="text-amber-300">{winnerName}</span>
                    </div>
                    <div className="text-sm font-black font-mono text-emerald-400">
                      +{formatRupee(potAmount)}
                    </div>
                  </div>

                  {/* Combination & Community Cards */}
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60 gap-2">
                    <span className="text-xs text-zinc-400 font-mono truncate">
                      {handDesc}
                    </span>

                    {hand.community_cards && hand.community_cards.length > 0 && (
                      <div className="flex items-center gap-1 shrink-0">
                        {hand.community_cards.slice(0, 5).map((c: any, i: number) => (
                          <CardView key={i} card={c} size="sm" />
                        ))}
                      </div>
                    )}
                  </div>
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
