import React, { useState, useEffect } from 'react';
import { Coins, Shield, ArrowRight, ArrowLeft, X, LogOut, Plus, RotateCcw, Check } from 'lucide-react';
import { formatRupee, VIRTUAL_CURRENCY_DISCLAIMER } from '@poker/shared';
import { soundManager } from '../audio/sound-manager.js';
import { useAccountWallet } from '../utils/accountWallet.js';
import { GoldCoin3D } from './CasinoChip3D.js';

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
  const { coins: walletCoins, reload100kCoins } = useAccountWallet();
  const defaultAmount = startingChips > 0 ? startingChips : 100000;
  const [amount, setAmount] = useState<number>(1000);
  const [inputValue, setInputValue] = useState<string>('1000');

  // Reset to 1,000 or startingChips on open
  useEffect(() => {
    if (isOpen) {
      const initial = 1000;
      setAmount(initial);
      setInputValue(String(initial));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Clear, intuitive presets including 1,000 chips explicitly
  const presets = [1000, 5000, 10000, 25000, 50000, 100000];

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
    soundManager.playCallChips();
    setAmount(val);
    setInputValue(String(val));
  };

  const handleAddAmount = (extra: number) => {
    soundManager.playCoinClink();
    const next = Math.max(100, (amount || 0) + extra);
    setAmount(next);
    setInputValue(String(next));
  };

  const handleReset = () => {
    setAmount(1000);
    setInputValue('1000');
  };

  const isValidAmount = amount >= 100 && amount <= 50000000 && amount <= walletCoins;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isValidAmount) {
      soundManager.playCallChips(amount);
      onRebuy(amount);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-fade-in overflow-y-auto pointer-events-auto">
      <div className="bg-[#090d16] border border-amber-500/50 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl relative my-auto text-center text-zinc-100 animate-scale-up">
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
        <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-2 text-amber-400 shadow-inner">
          <GoldCoin3D sizePx={32} tiltDeg={-8} />
        </div>

        <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
          Rebuy & Reload Table Chips
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5 font-medium leading-relaxed">
          Select an amount below to instantly add virtual chips to your table seat.
        </p>

        {/* Wallet Balance Display */}
        <div className="my-2 p-2.5 rounded-xl bg-zinc-950/90 border border-amber-500/30 flex items-center justify-between text-left">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-[11px] font-mono text-zinc-400">Account Wallet:</span>
          </div>
          <span className="font-mono font-bold text-xs text-amber-300">
            {formatRupee(walletCoins)}
          </span>
        </div>

        {/* ── Strict Zero Balance Reload Callout (Only appears when balance is ₹0) ── */}
        {walletCoins <= 0 && (
          <div className="my-2.5 p-3 rounded-2xl bg-gradient-to-r from-amber-950/80 via-zinc-950/90 to-amber-950/80 border border-amber-500/80 shadow-lg text-left animate-pulse">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-black text-amber-300 uppercase tracking-wider font-mono">
                Out of Wallet Coins!
              </span>
              <span className="text-[10px] font-mono font-bold text-rose-400">₹0 remaining</span>
            </div>
            <p className="text-[11px] text-zinc-300 leading-relaxed mb-2.5">
              Your account balance is empty. Claim a fresh reload of ₹1,00,000 free coins to continue playing!
            </p>
            <button
              type="button"
              onClick={() => {
                reload100kCoins();
                soundManager.playWin();
                setTimeout(() => soundManager.playCoinClink(), 300);
              }}
              className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition"
            >
              <RotateCcw className="w-3.5 h-3.5 text-zinc-950" />
              <span>Reload ₹1,00,000 Free Coins</span>
            </button>
          </div>
        )}


        {/* ── Quick Stack Presets (Click to Select) ── */}
        <div className="my-3 text-left">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1.5 px-0.5 flex items-center justify-between">
            <span>Select Chip Amount</span>
            <span className="text-amber-400 text-[9px] lowercase">click to apply</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {presets.map((amt) => {
              const isSelected = amount === amt;
              return (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleSelectPreset(amt)}
                  className={`py-2.5 px-2 rounded-xl border text-xs font-mono font-bold transition flex items-center justify-center gap-1 active:scale-95 ${
                    isSelected
                      ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-lg ring-2 ring-amber-400/50 scale-[1.02]'
                      : 'bg-zinc-900/90 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-amber-400 shrink-0" />}
                  <span>{formatRupee(amt)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Custom Amount Input Box ── */}
        <form onSubmit={handleSubmit} className="my-3 text-left p-3 rounded-2xl bg-zinc-950/90 border border-zinc-800">
          <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
            <span>Or Enter Custom Amount</span>
            <button
              type="button"
              onClick={handleReset}
              className="text-amber-400 hover:text-amber-300 flex items-center gap-1 transition lowercase"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>reset to ₹1,000</span>
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
              placeholder="e.g. 1000"
              className="w-full pl-8 pr-4 py-2.5 bg-zinc-900/90 border border-zinc-700/80 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 rounded-xl text-white font-mono font-bold text-base outline-none transition"
            />
          </div>

          {/* Quick Increment Buttons */}
          <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pt-0.5">
            {[500, 1000, 5000, 10000].map((step) => (
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
              {amount > walletCoins
                ? `Insufficient coins in wallet (${formatRupee(walletCoins)} available). Reload above!`
                : 'Please enter an amount between ₹100 and ₹5,00,00,000.'}
            </div>
          )}

        </form>

        {/* ── Rebuy CTA ── */}
        <button
          type="button"
          disabled={!isValidAmount}
          onClick={() => handleSubmit()}
          className="w-full mt-2 py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-amber-500/20 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed group"
        >
          <span>Rebuy & Add {isValidAmount ? formatRupee(amount) : ''} to Seat</span>
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
