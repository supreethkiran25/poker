import React, { useState } from 'react';
import { Coins, Shield, ArrowRight, LogOut } from 'lucide-react';
import { formatRupee, VIRTUAL_CURRENCY_DISCLAIMER } from '@poker/shared';

interface RebuyModalProps {
  startingChips: number;
  onRebuy: (amount: number) => void;
  onLeave: () => void;
  isOpen: boolean;
}

const PRESETS = [5000, 10000, 25000, 50000];

export const RebuyModal: React.FC<RebuyModalProps> = ({
  startingChips,
  onRebuy,
  onLeave,
  isOpen,
}) => {
  const [selectedAmount, setSelectedAmount] = useState(startingChips || 10000);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-zinc-950 border border-amber-500/50 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative my-auto text-center">
        {/* Animated Coins Icon */}
        <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400">
          <Coins className="w-8 h-8 animate-bounce" />
        </div>

        <h2 className="text-xl font-bold text-white tracking-tight">
          You're Out of Chips!
        </h2>
        <p className="text-xs text-zinc-400 mt-1.5 font-medium leading-relaxed">
          Need a stack refresh? Rebuy virtual chips now to stay in the game with your friends.
        </p>

        {/* Responsible Disclaimer */}
        <div className="my-4 p-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-[10px] font-mono text-zinc-400 flex items-center gap-2 text-left">
          <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">{VIRTUAL_CURRENCY_DISCLAIMER}</span>
        </div>

        {/* Stack Presets */}
        <div className="grid grid-cols-2 gap-2 my-4">
          {PRESETS.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => setSelectedAmount(amt)}
              className={`py-2.5 px-3 rounded-xl border text-xs font-mono font-bold transition flex flex-col items-center ${
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
          onClick={() => onRebuy(selectedAmount)}
          className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition active:scale-95 flex items-center justify-center gap-2"
        >
          <span>Rebuy {formatRupee(selectedAmount)}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Leave Table alternative */}
        <button
          onClick={onLeave}
          className="w-full mt-2.5 py-2.5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 rounded-xl border border-zinc-800 text-xs font-bold transition flex items-center justify-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Leave Table</span>
        </button>
      </div>
    </div>
  );
};
