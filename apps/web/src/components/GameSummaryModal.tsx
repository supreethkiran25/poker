import React from 'react';
import { X, ArrowLeft, Trophy, ArrowRight, RotateCcw, Home, Sparkles, Shield } from 'lucide-react';
import { formatRupee, VIRTUAL_CURRENCY_DISCLAIMER } from '@poker/shared';

export interface PlayerSummary {
  id: string;
  name: string;
  startingChips: number;
  endingChips: number;
  isMe?: boolean;
}

interface GameSummaryModalProps {
  players: PlayerSummary[];
  totalHands?: number;
  biggestPot?: number;
  largestWinner?: string;
  onClose: () => void;
  onPlayAgain?: () => void;
  onBackToHome?: () => void;
}

export const GameSummaryModal: React.FC<GameSummaryModalProps> = ({
  players,
  totalHands = 24,
  biggestPot = 12420,
  largestWinner = 'Alex',
  onClose,
  onPlayAgain,
  onBackToHome,
}) => {
  // Sort players by net result descending
  const sortedPlayers = [...players].sort((a, b) => {
    const netA = a.endingChips - a.startingChips;
    const netB = b.endingChips - b.startingChips;
    return netB - netA;
  });

  const bestWinner = sortedPlayers[0]?.name || largestWinner;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl relative my-auto flex flex-col gap-5">
        {/* Top Header with Back button */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-bold text-zinc-300 hover:text-white transition active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span>Back</span>
            </button>
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold text-base shadow-lg">
              🏆
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-bold text-white tracking-tight">Session Complete</h2>
              <div className="text-xs text-zinc-400 font-mono">Here's how everyone did.</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Column Content: Left Table + Right Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left 2 Columns: Results Table */}
          <div className="md:col-span-2 overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-800/80 text-zinc-500 uppercase text-[10px]">
                  <th className="pb-2.5 font-bold">Player</th>
                  <th className="pb-2.5 font-bold text-right">Starting Stack</th>
                  <th className="pb-2.5 font-bold text-right">Ending Stack</th>
                  <th className="pb-2.5 font-bold text-right">Net Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {sortedPlayers.map((player) => {
                  const net = player.endingChips - player.startingChips;
                  const isPositive = net > 0;
                  const isZero = net === 0;

                  return (
                    <tr
                      key={player.id}
                      className={`hover:bg-zinc-900/40 transition ${
                        player.isMe ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      <td className="py-3 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-600 via-amber-700 to-yellow-500 p-0.5 shadow flex items-center justify-center shrink-0">
                          <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-[10px] font-bold text-amber-300">
                            {player.name.slice(0, 2).toUpperCase()}
                          </div>
                        </div>
                        <div className="truncate font-sans font-bold text-zinc-200">
                          {player.name}
                          {player.isMe && (
                            <span className="ml-1.5 text-[9px] font-mono font-black bg-emerald-500/20 text-emerald-400 px-1 py-0.5 rounded">
                              YOU
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-right text-zinc-400">
                        {formatRupee(player.startingChips)}
                      </td>
                      <td className="py-3 text-right font-bold text-white">
                        {formatRupee(player.endingChips)}
                      </td>
                      <td
                        className={`py-3 text-right font-bold ${
                          isPositive
                            ? 'text-emerald-400'
                            : isZero
                            ? 'text-zinc-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {isPositive ? `+${formatRupee(net)}` : isZero ? '₹0' : `-${formatRupee(Math.abs(net))}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Right 1 Column: Summary Stat Badges */}
          <div className="md:col-span-1 flex flex-col gap-3">
            <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col">
              <span className="text-[10px] font-mono uppercase text-zinc-500">Total Hands</span>
              <span className="text-xl font-bold font-mono text-white mt-0.5">{totalHands}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col">
              <span className="text-[10px] font-mono uppercase text-zinc-500">Biggest Pot</span>
              <span className="text-xl font-bold font-mono text-amber-300 mt-0.5">
                {formatRupee(biggestPot)}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col">
              <span className="text-[10px] font-mono uppercase text-zinc-500">Largest Winner</span>
              <span className="text-base font-bold text-emerald-400 mt-0.5 truncate flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                {bestWinner}
              </span>
            </div>
          </div>
        </div>

        {/* Responsible Gaming Disclaimer */}
        <div className="p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800/80 text-[10px] font-mono text-zinc-500 flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{VIRTUAL_CURRENCY_DISCLAIMER}</span>
        </div>

        {/* Footer Actions matching Screen 10 */}
        <div className="pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onPlayAgain || onClose}
            className="w-full sm:flex-1 py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition active:scale-95 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again</span>
          </button>

          <button
            onClick={onBackToHome || onClose}
            className="w-full sm:flex-1 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-wider rounded-2xl border border-zinc-800 transition active:scale-95 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4 text-zinc-400" />
            <span>Back to Home</span>
          </button>
        </div>
      </div>
    </div>
  );
};
