import React, { useState } from 'react';
import { X, BookOpen, Award, Layers } from 'lucide-react';

interface RulesModalProps {
  onClose: () => void;
}

const HAND_RANKINGS = [
  { name: 'Royal Flush', desc: 'A, K, Q, J, 10, all same suit', example: 'A♠ K♠ Q♠ J♠ 10♠' },
  { name: 'Straight Flush', desc: 'Five cards in sequence, same suit', example: '9♥ 8♥ 7♥ 6♥ 5♥' },
  { name: 'Four of a Kind', desc: 'All four cards of the same rank', example: 'K♠ K♥ K♦ K♣ 4♦' },
  { name: 'Full House', desc: 'Three of a kind combined with a pair', example: 'Q♠ Q♥ Q♦ 8♣ 8♦' },
  { name: 'Flush', desc: 'Any five cards of the same suit', example: 'A♦ J♦ 8♦ 6♦ 2♦' },
  { name: 'Straight', desc: 'Five cards in a sequence, not same suit', example: '10♠ 9♦ 8♥ 7♣ 6♠' },
  { name: 'Three of a Kind', desc: 'Three cards of the same rank', example: '7♠ 7♥ 7♦ K♣ 2♦' },
  { name: 'Two Pair', desc: 'Two different pairs', example: 'J♠ J♦ 4♣ 4♠ A♥' },
  { name: 'One Pair', desc: 'Two cards of the same rank', example: '10♥ 10♦ A♠ 8♣ 3♦' },
  { name: 'High Card', desc: 'Highest card plays if no hand made', example: 'A♠ K♦ 9♣ 7♥ 2♠' },
];

export const RulesModal: React.FC<RulesModalProps> = ({ onClose }) => {
  const [tab, setTab] = useState<'overview' | 'rankings' | 'betting'>('overview');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl relative my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
              ♠
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Texas Hold'em Rules</h2>
              <div className="text-[11px] text-zinc-400 font-mono">Official Poker Guide</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector matching Screen 8 */}
        <div className="flex bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 my-4 flex-shrink-0">
          <button
            onClick={() => setTab('overview')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
              tab === 'overview'
                ? 'bg-emerald-800/80 border border-emerald-500/50 text-emerald-100 shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setTab('rankings')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
              tab === 'rankings'
                ? 'bg-emerald-800/80 border border-emerald-500/50 text-emerald-100 shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Hand Rankings
          </button>
          <button
            onClick={() => setTab('betting')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
              tab === 'betting'
                ? 'bg-emerald-800/80 border border-emerald-500/50 text-emerald-100 shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Betting
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1 text-xs space-y-4">
          {tab === 'overview' && (
            <div className="space-y-4">
              <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-2xl">
                <h3 className="font-bold text-amber-300 text-sm mb-1 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  Goal
                </h3>
                <p className="text-zinc-300 leading-relaxed">
                  Make the best 5-card hand using your 2 hole cards and 5 community cards.
                </p>
              </div>

              <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-2xl space-y-2.5">
                <h3 className="font-bold text-white text-sm mb-2 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  Game Flow
                </h3>
                <div className="space-y-1.5 text-zinc-300 font-mono text-[11px]">
                  <div>1. <span className="text-white font-bold">Pre-flop</span> – Players get 2 hole cards, post blinds.</div>
                  <div>2. <span className="text-white font-bold">Flop</span> – 3 community cards are dealt.</div>
                  <div>3. <span className="text-white font-bold">Turn</span> – 1 community card is dealt.</div>
                  <div>4. <span className="text-white font-bold">River</span> – 1 final community card is dealt.</div>
                  <div>5. <span className="text-white font-bold">Showdown</span> – Best hand wins the pot.</div>
                </div>
              </div>

              {/* Screen 8 Visual Hand Rankings Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                  <span>Hand Rankings</span>
                  <button
                    onClick={() => setTab('rankings')}
                    className="text-[11px] text-amber-400 hover:underline"
                  >
                    View all
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center">
                    <div className="text-[10px] font-bold text-zinc-200">Royal Flush</div>
                    <div className="text-[11px] font-mono font-black text-amber-400 mt-1">A♠ K♠ Q♠ J♠ 10♠</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center">
                    <div className="text-[10px] font-bold text-zinc-200">Straight Flush</div>
                    <div className="text-[11px] font-mono font-black text-amber-400 mt-1">9♥ 8♥ 7♥ 6♥ 5♥</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center">
                    <div className="text-[10px] font-bold text-zinc-200">Four of a Kind</div>
                    <div className="text-[11px] font-mono font-black text-amber-400 mt-1">K♠ K♥ K♦ K♣</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center">
                    <div className="text-[10px] font-bold text-zinc-200">Full House</div>
                    <div className="text-[11px] font-mono font-black text-amber-400 mt-1">Q♠ Q♥ Q♦ 8♣ 8♦</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'rankings' && (
            <div className="space-y-2">
              {HAND_RANKINGS.map((h, i) => (
                <div
                  key={i}
                  className="bg-zinc-900/60 border border-zinc-800/80 p-2.5 rounded-xl flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-zinc-100 flex items-center gap-1.5">
                      <span className="text-amber-400 font-mono text-[10px]">#{i + 1}</span>
                      <span>{h.name}</span>
                    </div>
                    <div className="text-[11px] text-zinc-400">{h.desc}</div>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-amber-300 bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
                    {h.example}
                  </span>
                </div>
              ))}
            </div>
          )}

          {tab === 'betting' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <span className="font-bold text-rose-400 uppercase">Fold</span>
                <p className="text-zinc-400 text-[11px] mt-0.5">
                  Surrender your cards and forfeit any chips already put into the pot.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <span className="font-bold text-emerald-400 uppercase">Check</span>
                <p className="text-zinc-400 text-[11px] mt-0.5">
                  Pass the action to the next player without betting anything (only possible if no one has bet before you).
                </p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <span className="font-bold text-blue-400 uppercase">Call</span>
                <p className="text-zinc-400 text-[11px] mt-0.5">
                  Match the current highest bet made by an opponent to stay in the hand.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <span className="font-bold text-amber-400 uppercase">Raise / Bet</span>
                <p className="text-zinc-400 text-[11px] mt-0.5">
                  Increase the bet size, forcing other players to either match your raise or fold.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer: Solid Gold Close Button matching Screen 8 */}
        <div className="pt-4 mt-2 border-t border-zinc-800 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition active:scale-95 flex items-center justify-center"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
