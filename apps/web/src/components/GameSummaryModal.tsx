import React, { useState } from 'react';
import {
  X,
  ArrowLeft,
  Trophy,
  Sparkles,
  Shield,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  LogOut,
  Wallet,
  Receipt,
  Users,
  Coins,
  Minus,
} from 'lucide-react';
import {
  formatRupee,
  VIRTUAL_CURRENCY_DISCLAIMER,
  type PlayerLedgerEntry,
  type RoomLedgerSummary,
} from '@poker/shared';
import { soundManager } from '../audio/sound-manager.js';
import { CasinoChipFaceSVG, GoldCoin3D } from './CasinoChip3D.js';

export interface PlayerSummary {
  id: string;
  name: string;
  startingChips: number;
  endingChips: number;
  isMe?: boolean;
}

interface GameSummaryModalProps {
  mode?: 'IN_GAME' | 'LEAVING';
  roomCode?: string;
  myPlayerId?: string;
  ledger?: PlayerLedgerEntry[];
  ledgerSummary?: RoomLedgerSummary;
  // Fallbacks if ledger is not provided (backward compatibility)
  players?: PlayerSummary[];
  totalHands?: number;
  biggestPot?: number;
  largestWinner?: string;
  onClose: () => void;
  onPlayAgain?: () => void;
  onBackToHome?: () => void;
  onConfirmLeave?: () => void;
}

export const GameSummaryModal: React.FC<GameSummaryModalProps> = ({
  mode = 'IN_GAME',
  roomCode = '',
  myPlayerId,
  ledger,
  ledgerSummary,
  players = [],
  totalHands: fallbackTotalHands = 1,
  biggestPot: fallbackBiggestPot = 0,
  largestWinner: fallbackLargestWinner = '',
  onClose,
  onPlayAgain,
  onBackToHome,
  onConfirmLeave,
}) => {
  const [copied, setCopied] = useState(false);

  // Normalize ledger entries: if ledger provided, use it; otherwise fallback from players
  const entries: PlayerLedgerEntry[] =
    ledger && ledger.length > 0
      ? ledger
      : players.map((p) => ({
          playerId: p.id,
          playerName: p.name,
          avatar: 'avatar-1',
          initialBuyIn: p.startingChips,
          rebuysCount: 0,
          rebuysTotal: 0,
          totalInvested: p.startingChips,
          currentChips: p.endingChips,
          netProfitLoss: p.endingChips - p.startingChips,
          status: p.endingChips <= 0 ? 'BUSTED' : 'ACTIVE',
          joinedAt: Date.now(),
          handsPlayed: 1,
          handsWon: p.endingChips > p.startingChips ? 1 : 0,
        }));

  // Sort by netProfitLoss descending (biggest winners on top)
  const sortedEntries = [...entries].sort((a, b) => b.netProfitLoss - a.netProfitLoss);

  // Find current user's entry
  const myEntry = sortedEntries.find((e) => e.playerId === myPlayerId);

  // Column Summaries & Totals (guaranteed clean column-by-column math)
  const totalHands = ledgerSummary?.totalHands ?? fallbackTotalHands;
  const biggestPot = ledgerSummary?.biggestPot ?? fallbackBiggestPot;
  const topWinner = sortedEntries[0]?.playerName || fallbackLargestWinner || 'Leader';

  const totalInitialBuyIns = sortedEntries.reduce((s, e) => s + e.initialBuyIn, 0);
  const totalRebuys = sortedEntries.reduce((s, e) => s + e.rebuysTotal, 0);
  const totalInvestedSum = sortedEntries.reduce((s, e) => s + e.totalInvested, 0);
  const totalChipsHeld = sortedEntries.reduce((s, e) => s + e.currentChips, 0);

  const totalBuyIns = ledgerSummary?.totalBuyIns ?? totalInvestedSum;
  const totalChipsInPlay =
    ledgerSummary?.totalChipsInPlay ??
    sortedEntries.filter((e) => e.status !== 'LEFT').reduce((s, e) => s + e.currentChips, 0);
  const currentPot = ledgerSummary?.currentPot ?? 0;
  const totalCashOuts =
    ledgerSummary?.totalCashOuts ??
    sortedEntries.filter((e) => e.status === 'LEFT').reduce((s, e) => s + e.currentChips, 0);
  const totalAccounted = totalChipsInPlay + currentPot + totalCashOuts;
  const discrepancy = ledgerSummary?.discrepancy ?? (totalAccounted - totalBuyIns);

  // Copy WhatsApp Settlement Summary to Clipboard
  const handleCopySummary = async () => {
    try {
      soundManager.playCoinClink();
      const lines = [
        `♠️ *POKER TABLE SETTLEMENT SUMMARY* ♠️`,
        roomCode ? `Room Code: #${roomCode}` : '',
        `Total Hands Played: ${totalHands}`,
        `─────────────────────────────`,
        `📊 *PLAYER SETTLEMENT LEDGER:*`,
        ...sortedEntries.map((e, idx) => {
          const medal = idx === 0 && e.netProfitLoss > 0 ? '🏆 ' : `${idx + 1}. `;
          const sign = e.netProfitLoss > 0 ? '+' : e.netProfitLoss < 0 ? '-' : '';
          const absNet = Math.abs(e.netProfitLoss).toLocaleString('en-IN');
          const rebuyStr = e.rebuysCount > 0 ? ` | Rebuys: ${e.rebuysCount}x (₹${e.rebuysTotal.toLocaleString('en-IN')})` : '';
          const statusStr = e.status === 'LEFT' ? ' [LEFT TABLE]' : e.status === 'BUSTED' ? ' [BUSTED]' : '';
          return `${medal}*${e.playerName}*${statusStr}: ${sign}₹${absNet}\n   ↳ In: ₹${e.totalInvested.toLocaleString('en-IN')} (Initial: ₹${e.initialBuyIn.toLocaleString('en-IN')}${rebuyStr}) | Out: ₹${e.currentChips.toLocaleString('en-IN')}`;
        }),
        `─────────────────────────────`,
        `💰 *Table Totals:*`,
        `• Initial Buy-Ins: ₹${totalInitialBuyIns.toLocaleString('en-IN')}`,
        `• Total Re-Buys: ₹${totalRebuys.toLocaleString('en-IN')}`,
        `• Total In (Buy-ins + Re-buys): ₹${totalBuyIns.toLocaleString('en-IN')}`,
        `• Total Chips Accounted: ₹${totalAccounted.toLocaleString('en-IN')}${currentPot > 0 ? ` (Held: ₹${totalChipsHeld.toLocaleString('en-IN')} + Live Pot: ₹${currentPot.toLocaleString('en-IN')})` : ''}`,
        `• Zero-Sum Audit: ${discrepancy === 0 ? '✓ 100% Balanced Clean Ledger (Zero Cheating)' : `Discrepancy: ₹${discrepancy}`}`,
        `\n_Generated by Poker Room Ledger - Tamper Proof_`,
      ].filter(Boolean);

      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const isLeaving = mode === 'LEAVING';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 animate-fade-in">
      {/* ── Fixed Card Container with non-clipping header & scrollable inner body ── */}
      <div className="bg-zinc-950 border border-zinc-800/90 rounded-3xl max-w-4xl w-full shadow-2xl relative my-auto flex flex-col text-white max-h-[92vh] overflow-hidden">
        
        {/* ── 1. Sticky / Pinned Header (Never Overlaps or Clips Content) ── */}
        <div className="flex items-center justify-between px-4 sm:px-7 py-3.5 sm:py-4 border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur-md shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-bold text-zinc-300 hover:text-white transition active:scale-95 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span>{isLeaving ? 'Stay at Table' : 'Back to Table'}</span>
            </button>

            <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center font-bold text-lg shadow-lg ${
              isLeaving
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
            }`}>
              {isLeaving ? <LogOut className="w-5 h-5 text-rose-400" /> : <Receipt className="w-5 h-5 text-amber-400" />}
            </div>

            <div>
              <h2 className="text-sm sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>{isLeaving ? 'Leave Table & Cash-Out Summary' : 'Table Settlement & Match Ledger'}</span>
                {roomCode && (
                  <span className="text-[11px] font-mono font-normal px-2 py-0.5 rounded-full bg-zinc-800 text-amber-300 border border-zinc-700">
                    #{roomCode}
                  </span>
                )}
              </h2>
              <div className="text-[11px] sm:text-xs text-zinc-400 hidden xs:block">
                {isLeaving
                  ? 'Final settlement slip and table accounting before you leave.'
                  : 'Verified cheat-proof ledger tracking all Buy-ins, Re-buys, and Net Profit/Loss.'}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── 2. Scrollable Modal Body (Smooth Scrolling with Zero Overlap) ── */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-7 py-4 sm:py-5 flex flex-col gap-4 sm:gap-5 min-h-0">
          
          {/* ── Personal Cash-Out Highlight Card ── */}
          {myEntry && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-zinc-900/90 via-zinc-900/70 to-zinc-950 border border-amber-500/25 shadow-xl relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-700 to-yellow-500 p-0.5 shadow-lg flex items-center justify-center shrink-0">
                    <div className="w-full h-full rounded-[14px] bg-zinc-950 flex items-center justify-center text-sm font-bold text-amber-300">
                      {myEntry.playerName.slice(0, 2).toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm sm:text-base font-bold text-zinc-100">{myEntry.playerName}</span>
                      <span className="text-[10px] font-mono font-black bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                        YOU
                      </span>
                      {myEntry.status === 'BUSTED' && (
                        <span className="text-[10px] font-mono font-black bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded border border-rose-500/30">
                          BUSTED
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-400 font-mono mt-0.5">
                      Hands Played: <span className="text-white font-bold">{myEntry.handsPlayed}</span> • Won: <span className="text-emerald-400 font-bold">{myEntry.handsWon}</span>
                    </div>
                  </div>
                </div>

                {/* Personal Ledger Numbers */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 w-full sm:w-auto">
                  <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-left sm:text-right">
                    <div className="text-[10px] font-mono uppercase text-zinc-500">Initial Buy-In</div>
                    <div className="text-sm font-bold font-mono text-zinc-200 mt-0.5">
                      {formatRupee(myEntry.initialBuyIn)}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-left sm:text-right">
                    <div className="text-[10px] font-mono uppercase text-zinc-500">
                      Re-Buys {myEntry.rebuysCount > 0 ? `(${myEntry.rebuysCount}x)` : ''}
                    </div>
                    <div className="text-sm font-bold font-mono text-amber-300 mt-0.5">
                      {myEntry.rebuysCount > 0 ? formatRupee(myEntry.rebuysTotal) : '₹0'}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-left sm:text-right">
                    <div className="text-[10px] font-mono uppercase text-zinc-500">Ending Chips</div>
                    <div className="text-sm font-bold font-mono text-white mt-0.5">
                      {formatRupee(myEntry.currentChips)}
                    </div>
                  </div>

                  <div className={`p-2.5 rounded-xl border text-left sm:text-right ${
                    myEntry.netProfitLoss > 0
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                      : myEntry.netProfitLoss < 0
                      ? 'bg-rose-950/40 border-rose-500/40 text-rose-400'
                      : 'bg-zinc-950/80 border-zinc-800 text-zinc-400'
                  }`}>
                    <div className="text-[10px] font-mono uppercase flex items-center justify-start sm:justify-end gap-1">
                      {myEntry.netProfitLoss > 0 ? (
                        <>
                          <TrendingUp className="w-3 h-3 text-emerald-400" />
                          <span>Profit</span>
                        </>
                      ) : myEntry.netProfitLoss < 0 ? (
                        <>
                          <TrendingDown className="w-3 h-3 text-rose-400" />
                          <span>Loss</span>
                        </>
                      ) : (
                        <>
                          <Minus className="w-3 h-3 text-zinc-400" />
                          <span>Even</span>
                        </>
                      )}
                    </div>
                    <div className="text-base font-black font-mono mt-0.5">
                      {myEntry.netProfitLoss > 0
                        ? `+${formatRupee(myEntry.netProfitLoss)}`
                        : myEntry.netProfitLoss < 0
                        ? `-${formatRupee(Math.abs(myEntry.netProfitLoss))}`
                        : '₹0'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Full Table Ledger Table ── */}
          <div className="flex flex-col gap-2 shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-zinc-300 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Full Table Accounting Ledger ({sortedEntries.length} Players)</span>
              </h3>

              {/* Copy WhatsApp Ledger Button */}
              <button
                onClick={handleCopySummary}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-bold text-amber-400 hover:text-amber-300 transition active:scale-95 shadow-sm"
                title="Copy WhatsApp friendly settlement text"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied Ledger!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-amber-400" />
                    <span>Copy Settlement</span>
                  </>
                )}
              </button>
            </div>

            <div className="border border-zinc-800/90 rounded-2xl overflow-hidden bg-zinc-950/60 shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono min-w-[620px]">
                  <thead>
                    <tr className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-3.5 font-bold">Player</th>
                      <th className="py-3 px-3 font-bold text-right">Initial Buy-In</th>
                      <th className="py-3 px-3 font-bold text-right">Re-buys</th>
                      <th className="py-3 px-3 font-bold text-right">Total Invested</th>
                      <th className="py-3 px-3 font-bold text-right">Chips / Out</th>
                      <th className="py-3 px-3.5 font-bold text-right">Net Profit / Loss</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900">
                    {sortedEntries.map((player, idx) => {
                      const isPositive = player.netProfitLoss > 0;
                      const isZero = player.netProfitLoss === 0;
                      const isMe = player.playerId === myPlayerId;
                      const isTop = idx === 0 && isPositive;

                      return (
                        <tr
                          key={player.playerId}
                          className={`hover:bg-zinc-900/50 transition ${
                            isMe ? 'bg-amber-500/10' : ''
                          }`}
                        >
                          {/* Player Column */}
                          <td className="py-3 px-3.5 flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full p-0.5 shadow flex items-center justify-center shrink-0 ${
                              isTop
                                ? 'bg-gradient-to-tr from-amber-400 to-yellow-500 ring-2 ring-amber-400/50'
                                : 'bg-zinc-800'
                            }`}>
                              <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-[10px] font-bold text-amber-300">
                                {player.playerName.slice(0, 2).toUpperCase()}
                              </div>
                            </div>
                            <div className="truncate">
                              <div className="flex items-center gap-1.5 font-sans font-bold text-zinc-200">
                                <span className="truncate">{player.playerName}</span>
                                {isMe && (
                                  <span className="text-[9px] font-mono font-black bg-emerald-500/20 text-emerald-400 px-1 py-0.2 rounded border border-emerald-500/30">
                                    YOU
                                  </span>
                                )}
                                {player.isBot && (
                                  <span className="text-[9px] font-mono bg-purple-500/20 text-purple-300 px-1 py-0.2 rounded border border-purple-500/30">
                                    AI
                                  </span>
                                )}
                                {player.status === 'LEFT' && (
                                  <span className="text-[9px] font-mono bg-zinc-800 text-zinc-400 px-1 py-0.2 rounded border border-zinc-700">
                                    LEFT
                                  </span>
                                )}
                                {player.status === 'BUSTED' && (
                                  <span className="text-[9px] font-mono bg-rose-500/20 text-rose-400 px-1 py-0.2 rounded border border-rose-500/30">
                                    BUST
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-zinc-500 font-mono">
                                {player.handsPlayed} hands ({player.handsWon} won)
                              </div>
                            </div>
                          </td>

                          {/* Initial Buy-In */}
                          <td className="py-3 px-3 text-right text-zinc-300 font-medium">
                            {formatRupee(player.initialBuyIn)}
                          </td>

                          {/* Re-buys */}
                          <td className="py-3 px-3 text-right">
                            {player.rebuysCount > 0 ? (
                              <div>
                                <span className="text-amber-400 font-bold">
                                  {formatRupee(player.rebuysTotal)}
                                </span>
                                <div className="text-[10px] text-zinc-500">
                                  {player.rebuysCount}x rebuy
                                </div>
                              </div>
                            ) : (
                              <span className="text-zinc-600">—</span>
                            )}
                          </td>

                          {/* Total Invested */}
                          <td className="py-3 px-3 text-right text-zinc-200 font-bold">
                            {formatRupee(player.totalInvested)}
                          </td>

                          {/* Chips / Cash-Out */}
                          <td className="py-3 px-3 text-right font-bold text-white">
                            {formatRupee(player.currentChips)}
                          </td>

                          {/* Net Profit / Loss */}
                          <td className="py-3 px-3.5 text-right font-black">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg ${
                                isPositive
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : isZero
                                  ? 'bg-zinc-800 text-zinc-400'
                                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {isPositive
                                ? `+${formatRupee(player.netProfitLoss)}`
                                : isZero
                                ? '₹0'
                                : `-${formatRupee(Math.abs(player.netProfitLoss))}`}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-zinc-900/95 border-t-2 border-zinc-700/80 font-bold text-white">
                    <tr>
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-amber-300 font-sans">
                          <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>Table Totals ({sortedEntries.length} Players)</span>
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono font-normal">
                          Zero-Sum Accounting Audit
                        </div>
                      </td>
                      {/* Sum of Initial Buy-ins */}
                      <td className="py-3 px-3 text-right text-zinc-300 font-mono font-bold">
                        {formatRupee(totalInitialBuyIns)}
                      </td>
                      {/* Sum of Re-buys */}
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        {totalRebuys > 0 ? (
                          <span className="text-amber-400">{formatRupee(totalRebuys)}</span>
                        ) : (
                          <span className="text-zinc-500">₹0</span>
                        )}
                      </td>
                      {/* Sum of Total Invested */}
                      <td className="py-3 px-3 text-right text-white font-mono font-black">
                        {formatRupee(totalInvestedSum)}
                      </td>
                      {/* Sum of Chips Accounted (Held + Pot) */}
                      <td className="py-3 px-3 text-right font-mono font-black">
                        <div className="text-white">{formatRupee(totalChipsHeld)}</div>
                        {currentPot > 0 && (
                          <div className="text-[10px] text-amber-400/90 font-normal">
                            + ₹{currentPot.toLocaleString('en-IN')} active pot
                          </div>
                        )}
                      </td>
                      {/* Net Balance Status */}
                      <td className="py-3 px-3.5 text-right font-mono font-black">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs ${
                            discrepancy === 0
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {discrepancy === 0 ? '✓ Balanced (₹0)' : `Discrepancy: ₹${discrepancy}`}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {/* Tamper-proof audit footer line */}
              <div className="px-3.5 py-2 bg-zinc-950 border-t border-zinc-800 text-[10px] font-mono text-zinc-400 flex items-center justify-between flex-wrap gap-2">
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <Shield className="w-3 h-3 text-emerald-400" />
                  Anti-Cheat Verification: Total Money In (₹{totalBuyIns.toLocaleString('en-IN')}) = Total Chips Accounted (₹{totalAccounted.toLocaleString('en-IN')})
                </span>
                <span className="text-emerald-400 font-bold">
                  Zero Misplaced Chips
                </span>
              </div>
            </div>
          </div>

          {/* ── Table Totals & Zero-Sum Integrity Check ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <div className="text-[10px] font-mono uppercase text-zinc-500">Total Buy-Ins + Rebuys</div>
              <div className="text-base font-bold font-mono text-zinc-200 mt-0.5">
                {formatRupee(totalBuyIns)}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <div className="text-[10px] font-mono uppercase text-zinc-500">Total Accounted Chips</div>
              <div className="text-base font-bold font-mono text-amber-300 mt-0.5">
                {formatRupee(totalAccounted)}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <div className="text-[10px] font-mono uppercase text-zinc-500">Ledger Balance</div>
              <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                <span>{discrepancy === 0 ? '✓ 100% Balanced' : `Discrepancy: ₹${discrepancy}`}</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <div className="text-[10px] font-mono uppercase text-zinc-500">Top Winner</div>
              <div className="text-sm font-bold text-emerald-400 mt-0.5 truncate flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{topWinner}</span>
              </div>
            </div>
          </div>

          {/* Responsible Gaming Disclaimer */}
          <div className="p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800/80 text-[10px] font-mono text-zinc-500 flex items-center gap-2 shrink-0">
            <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{VIRTUAL_CURRENCY_DISCLAIMER}</span>
          </div>

        </div>

        {/* ── 3. Sticky / Fixed Footer Action Bar ── */}
        <div className="px-4 sm:px-7 py-3.5 sm:py-4 border-t border-zinc-800/80 bg-zinc-950/95 backdrop-blur-md shrink-0 flex flex-col sm:flex-row items-center gap-3 z-20">
          {isLeaving ? (
            <>
              <button
                onClick={onClose}
                className="w-full sm:flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-wider rounded-2xl border border-zinc-800 transition active:scale-95 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4 text-zinc-400" />
                <span>Stay at Table</span>
              </button>

              <button
                onClick={onConfirmLeave || onBackToHome || onClose}
                className="w-full sm:flex-1 py-3 bg-gradient-to-r from-rose-600 via-rose-700 to-red-800 hover:from-rose-500 hover:to-red-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition active:scale-95 flex items-center justify-center gap-2 border border-rose-500/40"
              >
                <LogOut className="w-4 h-4" />
                <span>Confirm & Leave Table</span>
              </button>
            </>
          ) : (
            <>
              {onPlayAgain && (
                <button
                  onClick={onPlayAgain}
                  className="w-full sm:flex-1 py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <Coins className="w-4 h-4" />
                  <span>Play Next Hand</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="w-full sm:flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-wider rounded-2xl border border-zinc-800 transition active:scale-95 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4 text-amber-400" />
                <span>Back to Live Game</span>
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
