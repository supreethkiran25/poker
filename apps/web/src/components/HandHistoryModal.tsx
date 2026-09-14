import React, { useEffect, useState } from 'react';
import { X, History, Shield } from 'lucide-react';
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

  useEffect(() => {
    fetch(`/api/rooms/${roomCode}/history`)
      .then((res) => res.json())
      .then((data) => {
        setHistory(data.history || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [roomCode]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <History className="w-5 h-5" />
            <h3 className="text-lg">Game Summary & Hand History</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Disclaimer */}
        <div className="my-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300/90 font-mono flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{VIRTUAL_CURRENCY_DISCLAIMER}</span>
        </div>

        <div className="flex-1 overflow-y-auto py-3 space-y-3">
          {loading ? (
            <div className="text-center text-zinc-500 py-8">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="text-center text-zinc-500 py-8">
              No hands completed yet in this session.
            </div>
          ) : (
            history.map((hand) => (
              <div
                key={hand.id}
                className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                  <span>Hand #{hand.hand_number}</span>
                  <span className="text-amber-400 font-bold">
                    Pot: {formatRupee(hand.total_pot)}
                  </span>
                </div>

                {/* Community cards */}
                {hand.community_cards && hand.community_cards.length > 0 && (
                  <div className="flex items-center gap-1.5 my-1">
                    {hand.community_cards.map((c: any, i: number) => (
                      <CardView key={i} card={c} size="sm" />
                    ))}
                  </div>
                )}

                {/* Winners */}
                <div className="text-xs text-zinc-300">
                  {hand.winners.map((w: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between mt-1 font-mono">
                      <span className="text-emerald-400 font-bold">Winner:</span>
                      <span>{w.handName}</span>
                      <span className="text-amber-300 font-bold">
                        +{formatRupee(w.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
