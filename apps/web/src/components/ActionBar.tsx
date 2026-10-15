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
  compact?: boolean;
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
  compact = false,
  onAction,
}) => {
  const raiseAction = legalActions.find((a) => a.type === 'raise' || a.type === 'bet');
  const minRaise = Math.round(raiseAction?.minAmount ?? 0);
  const maxRaise = Math.round(raiseAction?.maxAmount ?? myChips);

  const [raiseAmount, setRaiseAmount] = useState<number>(minRaise);
  const [showRaiseSlider, setShowRaiseSlider] = useState<boolean>(() => {
    return localStorage.getItem('poker_show_bet_slider') !== 'false';
  });

  useEffect(() => {
    if (minRaise > 0) {
      setRaiseAmount((prev) => Math.max(minRaise, Math.min(maxRaise, prev || minRaise)));
    }
  }, [minRaise, maxRaise]);

  const toggleSlider = () => {
    setShowRaiseSlider((prev) => {
      const next = !prev;
      localStorage.setItem('poker_show_bet_slider', String(next));
      return next;
    });
  };

  // When not player's turn: luxury status strip with live pot indicator
  if (!isMyTurn || legalActions.length === 0) {
    return (
      <div
        className={`w-full bg-zinc-950/90 backdrop-blur-md border border-zinc-800/90 text-zinc-400 font-mono shadow-xl flex items-center justify-between px-4 py-2 rounded-2xl ${
          compact ? 'text-[10px]' : 'text-xs'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-zinc-200 font-sans font-bold">Hand in Progress</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
          <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
          <span>Waiting for opponents to act…</span>
        </div>
        <div className="text-amber-400 font-mono font-bold">
          POT: {formatRupee(pot)}
        </div>
      </div>
    );
  }

  const canFold = legalActions.some((a) => a.type === 'fold');
  const canCheck = legalActions.some((a) => a.type === 'check');
  const callAction = legalActions.find((a) => a.type === 'call');
  const canAllIn = legalActions.some((a) => a.type === 'all-in');

  const thirdPot = Math.min(maxRaise, Math.max(minRaise, currentBet + Math.round(pot / 3)));
  const halfPot = Math.min(maxRaise, Math.max(minRaise, currentBet + Math.round(pot / 2)));
  const threeQuarterPot = Math.min(maxRaise, Math.max(minRaise, currentBet + Math.round((pot * 3) / 4)));
  const fullPot = Math.min(maxRaise, Math.max(minRaise, currentBet + pot));
  const step = Math.max(10, minRaise > 0 ? Math.min(minRaise, 1000) : 100);

  return (
    <div
      className={`relative flex flex-col items-center bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 shadow-2xl w-full select-none overflow-hidden ${
        compact ? 'p-1.5 gap-1 rounded-xl' : 'p-2 sm:p-3 gap-2 rounded-2xl'
      }`}
    >
      {/* ── Top edge animated turn countdown progress bar (only when timer is active) ── */}
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
      <div className="w-full flex items-center justify-between px-1 text-[11px] font-mono pt-0.5">
        <div className="flex items-center gap-1.5 text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-bold text-zinc-200">YOUR TURN</span>
        </div>

        {secondsRemaining !== null ? (
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
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border bg-zinc-900/90 border-emerald-500/40 text-emerald-300 font-mono text-[10px] font-bold shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>NO TIMER • TAKE YOUR TIME</span>
          </div>
        )}
      </div>

      {/* ── Expandable Raise Popover / Slider ── */}
      {raiseAction && showRaiseSlider && (
        <div className="w-full flex flex-col gap-2 p-2 sm:p-2.5 rounded-xl bg-zinc-900/95 border border-amber-500/30 shadow-inner animate-fade-in">
          {/* Header Row: Min, Current Bet with +/- Steppers & Input, Max */}
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 gap-1 sm:gap-2">
            <span className="shrink-0 text-zinc-400 hidden xs:inline text-[10px]">
              Min: {formatRupee(minRaise)}
            </span>

            {/* Steppers & Interactive Amount */}
            <div className="flex items-center gap-1.5 mx-auto">
              <button
                type="button"
                onClick={() => setRaiseAmount((prev) => Math.max(minRaise, prev - step))}
                disabled={raiseAmount <= minRaise}
                className="w-7 h-7 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 active:scale-95 disabled:opacity-30 disabled:pointer-events-none rounded-lg text-amber-300 font-black text-sm border border-zinc-700 shadow-sm transition"
                title="Decrease bet"
              >
                -
              </button>

              <div className="flex items-center bg-zinc-950 border border-zinc-700 focus-within:border-amber-400/80 rounded-lg px-2.5 py-1 shadow-inner">
                <span className="text-amber-400 text-xs font-bold mr-1">₹</span>
                <input
                  type="number"
                  min={minRaise}
                  max={maxRaise}
                  value={raiseAmount}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (isNaN(val)) return;
                    setRaiseAmount(Math.max(minRaise, Math.min(maxRaise, Math.round(val))));
                  }}
                  className="w-18 sm:w-24 bg-transparent text-amber-300 text-right font-mono text-xs sm:text-sm font-black focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => setRaiseAmount((prev) => Math.min(maxRaise, prev + step))}
                disabled={raiseAmount >= maxRaise}
                className="w-7 h-7 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 active:scale-95 disabled:opacity-30 disabled:pointer-events-none rounded-lg text-amber-300 font-black text-sm border border-zinc-700 shadow-sm transition"
                title="Increase bet"
              >
                +
              </button>
            </div>

            <span className="shrink-0 text-zinc-400 hidden xs:inline text-[10px]">
              Max: {formatRupee(maxRaise)}
            </span>
          </div>

          {/* Slider */}
          <input
            type="range"
            min={minRaise}
            max={maxRaise}
            step={Math.max(1, Math.floor((maxRaise - minRaise) / 50))}
            value={raiseAmount}
            onChange={(e) => setRaiseAmount(Math.round(Number(e.target.value)))}
            className="w-full h-2.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500 shadow-inner"
          />

          {/* Preset Buttons */}
          <div className="grid grid-cols-6 gap-1 text-[10px] font-mono font-bold">
            <button
              type="button"
              onClick={() => setRaiseAmount(minRaise)}
              className={`py-1 rounded border transition active:scale-95 ${
                raiseAmount === minRaise
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-black'
                  : 'bg-zinc-950 hover:bg-zinc-800 border-zinc-700 text-zinc-300'
              }`}
            >
              MIN
            </button>
            <button
              type="button"
              onClick={() => setRaiseAmount(thirdPot)}
              className={`py-1 rounded border transition active:scale-95 ${
                raiseAmount === thirdPot
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-black'
                  : 'bg-zinc-950 hover:bg-zinc-800 border-zinc-700 text-zinc-300'
              }`}
            >
              ⅓ POT
            </button>
            <button
              type="button"
              onClick={() => setRaiseAmount(halfPot)}
              className={`py-1 rounded border transition active:scale-95 ${
                raiseAmount === halfPot
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-black'
                  : 'bg-zinc-950 hover:bg-zinc-800 border-zinc-700 text-zinc-300'
              }`}
            >
              ½ POT
            </button>
            <button
              type="button"
              onClick={() => setRaiseAmount(threeQuarterPot)}
              className={`py-1 rounded border transition active:scale-95 ${
                raiseAmount === threeQuarterPot
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-black'
                  : 'bg-zinc-950 hover:bg-zinc-800 border-zinc-700 text-zinc-300'
              }`}
            >
              ¾ POT
            </button>
            <button
              type="button"
              onClick={() => setRaiseAmount(fullPot)}
              className={`py-1 rounded border transition active:scale-95 ${
                raiseAmount === fullPot
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-black'
                  : 'bg-zinc-950 hover:bg-zinc-800 border-zinc-700 text-zinc-300'
              }`}
            >
              POT
            </button>
            <button
              type="button"
              onClick={() => setRaiseAmount(maxRaise)}
              className={`py-1 rounded border transition active:scale-95 ${
                raiseAmount === maxRaise
                  ? 'bg-amber-500 text-zinc-950 font-black border-amber-300 shadow-lg'
                  : 'bg-zinc-950 hover:bg-zinc-800 border-amber-500/50 text-amber-400'
              }`}
            >
              ALL-IN
            </button>
          </div>
        </div>
      )}

      {/* ── Main 4 Action Buttons Row matching Screen 5 (Fold, Check, Call, Raise) ── */}
      <div className={`flex items-stretch w-full ${compact ? 'gap-1.5' : 'gap-2'}`}>
        {/* Fold - Screen 5 Dark Charcoal Button */}
        {canFold && (
          <button
            onClick={() => onAction('fold')}
            className={`flex-1 bg-[#141822] hover:bg-[#1a202c] text-zinc-300 hover:text-white font-bold border border-zinc-800 hover:border-zinc-700 transition active:scale-95 text-xs tracking-wide flex items-center justify-center shadow-lg ${
              compact ? 'min-h-[36px] py-1.5 rounded-xl' : 'min-h-[48px] py-2.5 sm:py-3 rounded-2xl sm:text-sm'
            }`}
          >
            Fold
          </button>
        )}

        {/* Check - Screen 5 Deep Emerald Green Button */}
        {canCheck && (
          <button
            onClick={() => onAction('check')}
            className={`flex-1 bg-[#064e3b] hover:bg-[#047857] text-emerald-100 font-bold border border-emerald-500/50 transition active:scale-95 text-xs tracking-wide flex items-center justify-center shadow-lg ${
              compact ? 'min-h-[36px] py-1.5 rounded-xl' : 'min-h-[48px] py-2.5 sm:py-3 rounded-2xl sm:text-sm'
            }`}
          >
            Check
          </button>
        )}

        {/* Call - Screen 5 Royal Poker Blue Button */}
        {callAction && (
          <button
            onClick={() => onAction('call')}
            className={`flex-1 bg-[#1e40af] hover:bg-[#1d4ed8] text-blue-100 font-bold border border-blue-500/50 transition active:scale-95 text-xs tracking-wide flex items-center justify-center gap-1.5 shadow-lg ${
              compact ? 'min-h-[36px] py-1.5 rounded-xl' : 'min-h-[48px] py-2.5 sm:py-3 rounded-2xl sm:text-sm'
            }`}
          >
            <span>Call</span>
            <span className="font-mono text-blue-200 font-bold">
              {formatRupee(callAction.minAmount ?? 0)}
            </span>
          </button>
        )}

        {/* Raise / Bet - Screen 5 Solid Gold Button */}
        {raiseAction && (
          <div className="flex-1 flex gap-1">
            <button
              onClick={() => onAction(raiseAction.type, raiseAmount)}
              className={`flex-1 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black border border-yellow-300 transition active:scale-95 text-xs uppercase tracking-wide flex flex-col items-center justify-center leading-tight shadow-xl ${
                compact ? 'min-h-[36px] py-1 rounded-xl' : 'min-h-[48px] py-2 sm:py-2.5 rounded-2xl'
              }`}
            >
              <span className="text-[10px] sm:text-xs">
                {raiseAmount >= maxRaise
                  ? 'ALL-IN'
                  : raiseAction.type === 'bet'
                  ? 'BET'
                  : 'RAISE TO'}
              </span>
              <span className={`font-mono font-black text-zinc-950 ${compact ? 'text-xs' : 'text-xs sm:text-sm'}`}>
                {formatRupee(raiseAmount)}
              </span>
            </button>

            {/* Toggle Raise Slider */}
            <button
              onClick={toggleSlider}
              className={`bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-zinc-700 transition flex items-center justify-center ${
                compact ? 'px-2 rounded-xl' : 'px-2.5 rounded-2xl'
              }`}
              title={showRaiseSlider ? 'Collapse Bet Sizing' : 'Choose Custom Bet Size'}
            >
              {showRaiseSlider ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        )}

        {/* All-In fallback */}
        {!raiseAction && canAllIn && (
          <button
            onClick={() => onAction('all-in')}
            className={`flex-1 bg-gradient-to-r from-rose-600 to-amber-600 text-white font-black border border-amber-400 transition active:scale-95 text-xs uppercase tracking-wide shadow-xl ${
              compact ? 'min-h-[36px] py-1.5 rounded-xl' : 'min-h-[48px] py-2.5 sm:py-3 rounded-2xl sm:text-sm'
            }`}
          >
            All-In ({formatRupee(myChips)})
          </button>
        )}
      </div>
    </div>
  );
};
