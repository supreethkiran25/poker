import React, { useState } from 'react';
import { Coins, Shield, ArrowRight, ArrowLeft, X, LogOut } from 'lucide-react';
import { formatRupee, VIRTUAL_CURRENCY_DISCLAIMER } from '@poker/shared';

interface RebuyModalProps {
  startingChips: number;
  onRebuy: (amount: number) => void;
  onLeave: () => void;
  isOpen: boolean;
  onClose?: () => void;
}

const PRESETS = [5000, 10000, 25000, 50000];

export const RebuyModal: React.FC<RebuyModalProps> = ({
  startingChips,
  onRebuy,
  onLeave,
  isOpen,
  onClose,
}) => {
  const [selectedAmount, setSelectedAmount] = useState(startingChips || 10000);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
      <div className="bg-zinc-950 border border-amber-500/50 rounded-3xl p-5 sm:p-7 max-w-sm w-full shadow-2xl relative my-auto text-center">
        {/* Top Header with Back Button */}
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
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <div />
          )}
        </div>

        {/* Animated Coins Icon */}
        <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-3 text-amber-400">
          <Coins className="w-7 h-7 animate-bounce" />
        </div>

        <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
          Rebuy Virtual Chips
        </h2>
        <p className="text-xs text-zinc-400 mt-1 font-medium leading-relaxed">
          Top up your stack now to keep playing at the table.
        </p>

        {/* Responsible Disclaimer */}
        <div className="my-3 p-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-[10px] font-mono text-zinc-400 flex items-center gap-2 text-left">
          <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">{VIRTUAL_CURRENCY_DISCLAIMER}</span>
        </div>

        {/* Stack Presets */}
        <div className="grid grid-cols-2 gap-2 my-3">
          {PRESETS.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => setSelectedAmount(amt)}
              className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold transition flex flex-col items-center ${
                selectedAmount === amt
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              <span className="text-[9px] uppercase text-zinc-500">
                {amt === startingChips ? 'Default' : 'Top-Up'}
              </span>
              <span>{formatRupee(amt)}</span>
            </button>
          ))}
        </div>

        {/* Rebuy CTA */}
        <button
          type="button"
          onClick={() => onRebuy(selectedAmount)}
          className="w-full py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition active:scale-95 flex items-center justify-center gap-2"
        >
          <span>Rebuy {formatRupee(selectedAmount)}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Back to Table alternative */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-full mt-2 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl border border-zinc-800 text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
            <span>Back to Table</span>
          </button>
        )}

        {/* Leave Table alternative */}
        <button
          type="button"
          onClick={onLeave}
          className="w-full mt-2 py-2 bg-zinc-950 hover:bg-zinc-900 text-zinc-500 hover:text-rose-400 rounded-xl text-xs font-mono transition flex items-center justify-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Leave Table</span>
        </button>
      </div>
    </div>
  );
};
