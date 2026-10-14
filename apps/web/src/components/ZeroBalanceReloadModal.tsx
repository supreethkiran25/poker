import React from 'react';
import { RotateCcw, Sparkles, LogOut } from 'lucide-react';
import { formatRupee } from '@poker/shared';
import { soundManager } from '../audio/sound-manager.js';
import { useAccountWallet, DEFAULT_WELCOME_COINS } from '../utils/accountWallet.js';

import { GoldCoin3D } from './CasinoChip3D.js';

interface ZeroBalanceReloadModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onReloadSuccess?: () => void;
  onLeaveTable?: () => void;
}

export const ZeroBalanceReloadModal: React.FC<ZeroBalanceReloadModalProps> = ({
  isOpen,
  onClose,
  onReloadSuccess,
  onLeaveTable,
}) => {
  const { coins, reload100kCoins } = useAccountWallet();

  // Strict anti-loophole guard: only open if user has 0 (or less) coins
  if (!isOpen || coins > 0) return null;

  const handleClaimReload = () => {
    soundManager.playWin();
    setTimeout(() => soundManager.playCoinClink(), 300);
    reload100kCoins();
    if (onReloadSuccess) {
      onReloadSuccess();
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in pointer-events-auto">
      <div className="relative bg-[#090d16] border-2 border-amber-500/70 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-[0_0_50px_rgba(245,158,11,0.3)] text-center text-zinc-100 animate-scale-up overflow-hidden">
        {/* Ambient golden top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-amber-500/15 blur-2xl pointer-events-none rounded-full" />

        {/* 3D Coin & Empty Warning Icon */}
        <div className="relative mx-auto w-16 h-16 mb-3 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-md animate-pulse" />
          <GoldCoin3D sizePx={44} tiltDeg={-10} />
          <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-mono font-bold shadow-md">
            ₹0
          </span>
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
          <span>You're Out of Chips!</span>
        </h2>

        {/* Subtitle / Description */}
        <p className="text-xs sm:text-sm text-zinc-300 mt-2 mb-4 leading-relaxed max-w-sm mx-auto">
          Your chip balance has hit <span className="font-mono font-bold text-amber-400">₹0</span>. 
          Ready to get back in the action with a fresh stack?
        </p>

        {/* Reload Offer Box */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-b from-amber-500/15 to-transparent border border-amber-500/40 relative">
          <div className="flex items-center justify-between text-left">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                Instant Bankroll Reload
              </span>
              <span className="text-2xl font-black font-mono text-white tracking-tight">
                +{formatRupee(DEFAULT_WELCOME_COINS)}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
          </div>
          <p className="text-[11px] text-zinc-400 mt-2 text-left leading-normal">
            100% free virtual practice coins credited directly to your account.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleClaimReload}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 active:scale-95 text-zinc-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition group"
          >
            <RotateCcw className="w-4 h-4 text-zinc-950 group-hover:rotate-180 transition-transform duration-500" />
            <span>Reload ₹1,00,000 Coins</span>
          </button>

          {onLeaveTable ? (
            <button
              type="button"
              onClick={onLeaveTable}
              className="w-full py-2.5 px-4 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/60 rounded-2xl text-xs font-mono font-semibold text-zinc-300 hover:text-white transition flex items-center justify-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5 text-zinc-400" />
              <span>Leave Table</span>
            </button>
          ) : onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/60 rounded-2xl text-xs font-mono font-semibold text-zinc-400 hover:text-white transition"
            >
              Maybe Later
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
