import React, { useState, useEffect } from 'react';
import { Coins, Shield, ArrowRight, ArrowLeft, X, LogOut, Plus, RotateCcw } from 'lucide-react';
import { formatRupee, VIRTUAL_CURRENCY_DISCLAIMER } from '@poker/shared';

interface RebuyModalProps {
  startingChips: number;
  onRebuy: (amount: number) => void;
  onLeave: () => void;
  isOpen: boolean;
  onClose?: () => void;
}

export const RebuyModal: React.FC<RebuyModalProps> = ({
  startingChips,
  onRebuy,
  onLeave,
  isOpen,
  onClose,
}) => {
  const defaultAmount = startingChips > 0 ? startingChips : 10000;
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [inputValue, setInputValue] = useState<string>(String(defaultAmount));

  // Reset to default on open
  useEffect(() => {
    if (isOpen) {
      setAmount(defaultAmount);
      setInputValue(String(defaultAmount));
    }
  }, [isOpen, defaultAmount]);

  if (!isOpen) return null;

  const presets = [
    Math.max(1000, Math.round(defaultAmount * 0.5)),
    defaultAmount,
    defaultAmount * 2,
    defaultAmount * 5,
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setInputValue(raw);
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setAmount(parsed);
    } else {
      setAmount(0);
    }
  };

  const handleSelectPreset = (val: number) => {
    setAmount(val);
    setInputValue(String(val));
  };

  const handleAddAmount = (extra: number) => {
    const next = Math.max(100, (amount || 0) + extra);
    setAmount(next);
    setInputValue(String(next));
  };

  const handleReset = () => {
    setAmount(defaultAmount);
    setInputValue(String(defaultAmount));
  };

  const isValidAmount = amount >= 100 && amount <= 50000000;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-fade-in overflow-y-auto pointer-events-auto">
      <div className="bg-[#090d16] border border-amber-500/40 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl relative my-auto text-center text-zinc-100 animate-scale-up">
        {/* Top Header with Back / Close */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-3">
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-bold text-zinc-300 hover:text-white transition active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
            Rebuy Chips
          </span>

          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <div />
          )}
        </div>

        {/* Animated Coins Icon */}
        <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-2.5 text-amber-400 shadow-inner">
          <Coins className="w-6 h-6 animate-pulse" />
        </div>

        <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
          Rebuy Virtual Chips
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5 font-medium leading-relaxed">
          Select a quick chip preset or enter your own custom amount to top up your stack.
        </p>

        {/* Responsible Disclaimer */}
        <div className="my-2.5 p-2 rounded-xl bg-zinc-950/80 border border-zinc-800 text-[10px] font-mono text-zinc-400 flex items-center gap-2 text-left">
          <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">{VIRTUAL_CURRENCY_DISCLAIMER}</span>
        </div>

        {/* ── Quick Stack Presets ── */}
        <div className="my-3 text-left">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1.5 px-0.5">
            Quick Chip Presets
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {presets.map((amt) => {
              const isSelected = amount === amt;
              return (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleSelectPreset(amt)}
                  className={`py-2 px-1 rounded-xl border text-xs font-mono font-bold transition flex flex-col items-center justify-center ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow ring-1 ring-amber-400/40'
                      : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                  }`}
                >
                  <span className="text-[8px] uppercase text-zinc-500">
                    {amt === defaultAmount ? 'Default' : 'Top-Up'}
                  </span>
                  <span className="truncate w-full text-center">{formatRupee(amt)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Custom Amount Input Box ── */}
        <div className="my-3 text-left p-3 rounded-2xl bg-zinc-950/90 border border-zinc-800">
          <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
            <span>Custom Rebuy Amount</span>
            <button
              type="button"
              onClick={handleReset}
              className="text-amber-400 hover:text-amber-300 flex items-center gap-1 transition lowercase"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>reset</span>
            </button>
          </div>

          {/* Number Input with Rupee symbol */}
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-base font-bold text-amber-400 pointer-events-none font-serif">
              ₹
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Enter amount (e.g. 15000)"
              className="w-full pl-8 pr-4 py-2.5 bg-zinc-900/90 border border-zinc-700/80 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 rounded-xl text-white font-mono font-bold text-base outline-none transition"
            />
          </div>

          {/* Quick Increment Buttons */}
          <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pt-0.5">
            {[1000, 5000, 10000, 25000].map((step) => (
              <button
                key={step}
                type="button"
                onClick={() => handleAddAmount(step)}
                className="px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 text-[11px] font-mono text-zinc-300 hover:text-amber-300 transition active:scale-95 shrink-0 flex items-center gap-0.5"
              >
                <Plus className="w-2.5 h-2.5 text-amber-400" />
                <span>{step >= 1000 ? `${step / 1000}k` : step}</span>
              </button>
            ))}
          </div>

          {!isValidAmount && (
            <div className="text-[10px] font-mono text-rose-400 mt-1.5">
              Please enter an amount between ₹100 and ₹50,00,000.
            </div>
          )}
        </div>

        {/* ── Rebuy CTA ── */}
        <button
          type="button"
          disabled={!isValidAmount}
          onClick={() => isValidAmount && onRebuy(amount)}
          className="w-full mt-2 py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-amber-500/20 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed group"
        >
          <span>Rebuy {isValidAmount ? formatRupee(amount) : ''} Chips</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Back to Table alternative */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-full mt-2 py-2 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl border border-zinc-800 text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
            <span>Back to Table</span>
          </button>
        )}

        {/* Leave Table alternative */}
        <button
          type="button"
          onClick={onLeave}
          className="w-full mt-1.5 py-1.5 bg-transparent hover:bg-zinc-900/40 text-zinc-500 hover:text-rose-400 rounded-xl text-xs font-mono transition flex items-center justify-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Leave Table</span>
        </button>
      </div>
    </div>
  );
};
