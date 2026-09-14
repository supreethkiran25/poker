import React, { useState, useEffect } from 'react';
import type { ActionType, LegalAction } from '@poker/shared';
import { formatRupee } from '@poker/shared';
import { ChevronUp, ChevronDown, Clock } from 'lucide-react';

interface ActionBarProps {
  isMyTurn: boolean;
  legalActions: LegalAction[];
  pot: number;
  currentBet: number;
  myChips: number;
  secondsRemaining?: number | null;
  turnDuration?: number;
  onAction: (type: ActionType, amount?: number) => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  isMyTurn,
  legalActions,
  pot,
  currentBet,
  myChips,
  secondsRemaining = null,
  turnDuration = 30,
  onAction,
}) => {
  const raiseAction = legalActions.find((a) => a.type === 'raise' || a.type === 'bet');
  const minRaise = Math.round(raiseAction?.minAmount ?? 0);
  const maxRaise = Math.round(raiseAction?.maxAmount ?? myChips);

  const [raiseAmount, setRaiseAmount] = useState<number>(minRaise);
  const [showRaiseSlider, setShowRaiseSlider] = useState(false);

  useEffect(() => {
    if (minRaise > 0) setRaiseAmount(minRaise);
  }, [minRaise]);

  // When not player's turn: clean placeholder with consistent height
  if (!isMyTurn || legalActions.length === 0) {
    return (
      <div className="w-full bg-zinc-950/80 backdrop-blur-md px-4 py-3 rounded-2xl border border-zinc-800/80 text-zinc-500 font-mono text-xs shadow-xl text-center flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-amber-400/60 animate-pulse" />
        <span>Waiting for other players…</span>
      </div>
    );
  }

  const canFold = legalActions.some((a) => a.type === 'fold');
  const canCheck = legalActions.some((a) => a.type === 'check');
  const callAction = legalActions.find((a) => a.type === 'call');
  const canAllIn = legalActions.some((a) => a.type === 'all-in');

  const halfPot = Math.min(maxRaise, Math.max(minRaise, currentBet + Math.round(pot / 2)));
  const fullPot = Math.min(maxRaise, Math.max(minRaise, currentBet + pot));
  const doublePot = Math.min(maxRaise, Math.max(minRaise, currentBet + pot * 2));

  return (
    <div className="relative flex flex-col items-center gap-2 bg-zinc-950/95 backdrop-blur-xl p-2 sm:p-3 rounded-2xl border border-zinc-800 shadow-2xl w-full select-none overflow-hidden">
      {/* ── Top edge animated turn countdown progress bar ── */}
      {secondsRemaining !== null && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-800/80 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              secondsRemaining <= 5
                ? 'bg-rose-500 animate-pulse'
                : secondsRemaining <= 10
                ? 'bg-amber-400'
                : 'bg-emerald-400'
            }`}
            style={{
              width: `${Math.max(
                0,
                Math.min(100, (secondsRemaining / (turnDuration || 30)) * 100)
              )}%`,
            }}
          />
        </div>
      )}

      {/* ── Turn Decision Badge ── */}
      {secondsRemaining !== null && (
        <div className="w-full flex items-center justify-between px-1 text-[11px] font-mono pt-0.5">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold text-zinc-200">YOUR TURN</span>
          </div>

          <div
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border transition-all ${
              secondsRemaining <= 5
                ? 'bg-rose-500/30 border-rose-500 text-rose-300 animate-pulse font-black'
                : secondsRemaining <= 10
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-bold'
                : 'bg-zinc-900 border-zinc-700 text-zinc-300 font-bold'
            }`}
          >
            <Clock className={`w-3 h-3 ${secondsRemaining <= 5 ? 'animate-spin text-rose-400' : 'text-amber-400'}`} />
            <span>00:{secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining}</span>
          </div>
        </div>
      )}
      {/* ── Expandable Raise Popover / Slider ── */}
      {raiseAction && showRaiseSlider && (
        <div className="w-full flex flex-col gap-2 p-2.5 rounded-xl bg-zinc-900/90 border border-amber-500/30 animate-fade-in">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
            <span>Min: {formatRupee(minRaise)}</span>
            <div className="flex items-center gap-1 font-bold text-amber-300">
              <span>{raiseAction.type === 'bet' ? 'Bet' : 'Raise'}:</span>
              <div className="flex items-center bg-zinc-950 border border-zinc-700 rounded px-2 py-0.5">
                <span className="text-amber-400 text-xs mr-0.5">₹</span>
                <input
                  type="number"
                  min={minRaise}
                  max={maxRaise}
                  value={raiseAmount}
                  onChange={(e) => setRaiseAmount(Math.round(Number(e.target.value)))}
                  className="w-16 sm:w-20 bg-transparent text-amber-300 text-right font-mono text-xs font-bold focus:outline-none"
                />
              </div>
            </div>
            <span>Max: {formatRupee(maxRaise)}</span>
          </div>

          {/* Slider */}
          <input
            type="range"
            min={minRaise}
            max={maxRaise}
            step={Math.max(1, Math.floor((maxRaise - minRaise) / 40))}
            value={raiseAmount}
            onChange={(e) => setRaiseAmount(Math.round(Number(e.target.value)))}
            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />

          {/* Preset Buttons */}
          <div className="grid grid-cols-5 gap-1 text-[10px] font-mono font-bold">
            <button
              onClick={() => setRaiseAmount(minRaise)}
              className="py-1 bg-zinc-950 hover:bg-zinc-800 rounded border border-zinc-700 text-zinc-300 transition"
            >
              MIN
            </button>
            <button
              onClick={() => setRaiseAmount(halfPot)}
              className="py-1 bg-zinc-950 hover:bg-zinc-800 rounded border border-zinc-700 text-zinc-300 transition"
            >
              ½ POT
            </button>
            <button
              onClick={() => setRaiseAmount(fullPot)}
              className="py-1 bg-zinc-950 hover:bg-zinc-800 rounded border border-zinc-700 text-zinc-300 transition"
            >
              POT
            </button>
            <button
              onClick={() => setRaiseAmount(doublePot)}
              className="py-1 bg-zinc-950 hover:bg-zinc-800 rounded border border-zinc-700 text-zinc-300 transition"
            >
              2×POT
            </button>
            <button
              onClick={() => setRaiseAmount(maxRaise)}
              className="py-1 bg-zinc-950 hover:bg-zinc-800 rounded border border-amber-500/50 text-amber-400 transition"
            >
              ALL-IN
            </button>
          </div>
        </div>
      )}

      {/* ── Main 4 Action Buttons Row (Fold, Check, Call, Raise) ── */}
      <div className="flex items-stretch gap-1.5 sm:gap-2 w-full">
        {/* Fold */}
        {canFold && (
          <button
            onClick={() => onAction('fold')}
            className="flex-1 py-2.5 sm:py-3 bg-zinc-900 hover:bg-rose-950/60 text-zinc-300 hover:text-rose-300 font-bold rounded-xl border border-zinc-800 hover:border-rose-500/40 transition active:scale-95 text-xs uppercase tracking-wide flex items-center justify-center"
          >
            Fold
          </button>
        )}

        {/* Check */}
        {canCheck && (
          <button
            onClick={() => onAction('check')}
            className="flex-1 py-2.5 sm:py-3 bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-100 font-bold rounded-xl border border-emerald-500/50 transition active:scale-95 text-xs uppercase tracking-wide flex items-center justify-center shadow-lg"
          >
            Check
          </button>
        )}

        {/* Call */}
        {callAction && (
          <button
            onClick={() => onAction('call')}
            className="flex-1 py-2.5 sm:py-3 bg-blue-900/70 hover:bg-blue-800/90 text-blue-100 font-bold rounded-xl border border-blue-500/50 transition active:scale-95 text-xs uppercase tracking-wide flex flex-col items-center justify-center leading-tight shadow-lg"
          >
            <span>Call</span>
            <span className="text-[10px] font-mono text-blue-300">
              {formatRupee(callAction.minAmount ?? 0)}
            </span>
          </button>
        )}

        {/* Raise / Bet */}
        {raiseAction && (
          <div className="flex-1 flex gap-1">
            <button
              onClick={() => onAction(raiseAction.type, raiseAmount)}
              className="flex-1 py-2.5 sm:py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black rounded-xl border border-yellow-300 transition active:scale-95 text-xs uppercase tracking-wide flex flex-col items-center justify-center leading-tight shadow-lg"
            >
              <span>{raiseAction.type === 'bet' ? 'Bet' : 'Raise'}</span>
              <span className="text-[10px] font-mono font-bold text-zinc-900">
                {formatRupee(raiseAmount)}
              </span>
            </button>

            {/* Toggle Raise Slider */}
            <button
              onClick={() => setShowRaiseSlider(!showRaiseSlider)}
              className="px-2 bg-zinc-900 hover:bg-zinc-800 text-amber-400 rounded-xl border border-zinc-700 transition flex items-center justify-center"
              title="Adjust Bet Size"
            >
              {showRaiseSlider ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        )}

        {/* All-In fallback */}
        {!raiseAction && canAllIn && (
          <button
            onClick={() => onAction('all-in')}
            className="flex-1 py-2.5 sm:py-3 bg-gradient-to-r from-rose-600 to-amber-600 text-white font-black rounded-xl border border-amber-400 transition active:scale-95 text-xs uppercase tracking-wide"
          >
            All-In ({formatRupee(myChips)})
          </button>
        )}
      </div>
    </div>
  );
};
