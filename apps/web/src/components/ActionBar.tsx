import React, { useState, useEffect } from 'react';
import type { ActionType, LegalAction } from '@poker/shared';
import { formatRupee } from '@poker/shared';

interface ActionBarProps {
  isMyTurn: boolean;
  legalActions: LegalAction[];
  pot: number;
  currentBet: number;
  myChips: number;
  onAction: (type: ActionType, amount?: number) => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  isMyTurn,
  legalActions,
  pot,
  currentBet,
  myChips,
  onAction,
}) => {
  const raiseAction = legalActions.find((a) => a.type === 'raise' || a.type === 'bet');
  const minRaise = Math.round(raiseAction?.minAmount ?? 0);
  const maxRaise = Math.round(raiseAction?.maxAmount ?? myChips);

  const [raiseAmount, setRaiseAmount] = useState<number>(minRaise);

  useEffect(() => {
    if (minRaise > 0) {
      setRaiseAmount(minRaise);
    }
  }, [minRaise]);

  if (!isMyTurn || legalActions.length === 0) {
    return (
      <div className="bg-zinc-950/80 backdrop-blur-md px-6 py-2.5 rounded-2xl border border-zinc-800/80 text-zinc-500 font-mono text-xs shadow-xl flex items-center justify-center">
        Waiting for other players to act...
      </div>
    );
  }

  const canFold = legalActions.some((a) => a.type === 'fold');
  const canCheck = legalActions.some((a) => a.type === 'check');
  const callAction = legalActions.find((a) => a.type === 'call');
  const canAllIn = legalActions.some((a) => a.type === 'all-in');

  // Quick preset calculations using integer rounding
  const halfPot = Math.min(maxRaise, Math.max(minRaise, currentBet + Math.round(pot / 2)));
  const fullPot = Math.min(maxRaise, Math.max(minRaise, currentBet + pot));
  const doublePot = Math.min(maxRaise, Math.max(minRaise, currentBet + pot * 2));

  return (
    <div className="flex flex-col items-center gap-2.5 bg-zinc-950/90 backdrop-blur-xl p-3 sm:p-4 rounded-2xl border border-amber-500/30 shadow-2xl w-full max-w-2xl">
      {/* Raise slider & quick buttons (if raise or bet is legal) */}
      {raiseAction && (
        <div className="w-full flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>Min: {formatRupee(minRaise)}</span>
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <span>{raiseAction.type === 'bet' ? 'Bet' : 'Raise to'}:</span>
              <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded px-2 py-0.5">
                <span className="text-amber-400 text-xs mr-0.5">₹</span>
                <input
                  type="number"
                  min={minRaise}
                  max={maxRaise}
                  value={raiseAmount}
                  onChange={(e) => setRaiseAmount(Math.round(Number(e.target.value)))}
                  className="w-24 bg-transparent text-amber-300 text-right font-mono text-xs focus:outline-none"
                />
              </div>
            </div>
            <span>Max: {formatRupee(maxRaise)}</span>
          </div>

          <input
            type="range"
            min={minRaise}
            max={maxRaise}
            step={Math.max(1, Math.floor((maxRaise - minRaise) / 50))}
            value={raiseAmount}
            onChange={(e) => setRaiseAmount(Math.round(Number(e.target.value)))}
            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />

          {/* Quick preset buttons */}
          <div className="grid grid-cols-5 gap-1.5">
            <button
              onClick={() => setRaiseAmount(minRaise)}
              className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[11px] font-bold rounded border border-zinc-700 transition"
            >
              MIN
            </button>
            <button
              onClick={() => setRaiseAmount(halfPot)}
              className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[11px] font-bold rounded border border-zinc-700 transition"
            >
              1/2 POT
            </button>
            <button
              onClick={() => setRaiseAmount(fullPot)}
              className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[11px] font-bold rounded border border-zinc-700 transition"
            >
              POT
            </button>
            <button
              onClick={() => setRaiseAmount(doublePot)}
              className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[11px] font-bold rounded border border-zinc-700 transition"
            >
              2X POT
            </button>
            <button
              onClick={() => setRaiseAmount(maxRaise)}
              className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-amber-400 text-[11px] font-bold rounded border border-amber-500/40 transition"
            >
              ALL-IN
            </button>
          </div>
        </div>
      )}

      {/* Main Action Buttons */}
      <div className="flex items-center gap-2 sm:gap-3 w-full">
        {/* Fold Button */}
        {canFold && (
          <button
            onClick={() => onAction('fold')}
            className="flex-1 py-2.5 sm:py-3 bg-gradient-to-b from-rose-700 to-rose-900 hover:from-rose-600 hover:to-rose-800 text-white font-bold rounded-xl shadow-lg border border-rose-500/50 transition active:scale-95 text-xs sm:text-sm uppercase tracking-wider"
          >
            Fold
          </button>
        )}

        {/* Check Button */}
        {canCheck && (
          <button
            onClick={() => onAction('check')}
            className="flex-1 py-2.5 sm:py-3 bg-gradient-to-b from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg border border-emerald-400/50 transition active:scale-95 text-xs sm:text-sm uppercase tracking-wider"
          >
            Check
          </button>
        )}

        {/* Call Button */}
        {callAction && (
          <button
            onClick={() => onAction('call')}
            className="flex-1 py-2.5 sm:py-3 bg-gradient-to-b from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg border border-blue-400/50 transition active:scale-95 text-xs sm:text-sm uppercase tracking-wider flex flex-col items-center justify-center leading-tight"
          >
            <span>Call</span>
            <span className="text-[10px] font-mono text-blue-200">
              {formatRupee(callAction.minAmount ?? 0)}
            </span>
          </button>
        )}

        {/* Bet / Raise Button */}
        {raiseAction && (
          <button
            onClick={() => onAction(raiseAction.type, raiseAmount)}
            className="flex-1 py-2.5 sm:py-3 bg-gradient-to-b from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-zinc-950 font-black rounded-xl shadow-lg border border-yellow-300 transition active:scale-95 text-xs sm:text-sm uppercase tracking-wider flex flex-col items-center justify-center leading-tight"
          >
            <span>{raiseAction.type === 'bet' ? 'Bet' : 'Raise'}</span>
            <span className="text-[10px] font-mono text-zinc-900">
              {formatRupee(raiseAmount)}
            </span>
          </button>
        )}

        {/* All-in Button (if not covered by raise) */}
        {!raiseAction && canAllIn && (
          <button
            onClick={() => onAction('all-in')}
            className="flex-1 py-2.5 sm:py-3 bg-gradient-to-b from-amber-600 to-red-700 hover:from-amber-500 hover:to-red-600 text-white font-black rounded-xl shadow-lg border border-amber-400 transition active:scale-95 text-xs sm:text-sm uppercase tracking-wider"
          >
            All-In ({formatRupee(myChips)})
          </button>
        )}
      </div>
    </div>
  );
};
