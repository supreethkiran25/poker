import React, { useState } from 'react';
import { Shield, Zap, Coins, Users, Play, BookOpen, HelpCircle } from 'lucide-react';
import { VIRTUAL_CURRENCY_DISCLAIMER } from '@poker/shared';
import { RulesModal } from '../components/RulesModal.js';

interface LandingPageProps {
  initialRoomCode?: string;
  onOpenCreate: () => void;
  onOpenJoin: () => void;
  onJoinRoom: (code: string, name: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  initialRoomCode = '',
  onOpenCreate,
  onOpenJoin,
  onJoinRoom,
}) => {
  const [showRules, setShowRules] = useState(false);
  const [showFaq, setShowFaq] = useState(false);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#07090e] text-zinc-100 selection:bg-amber-500 selection:text-zinc-950 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* ── Top Nav ── */}
      <header className="w-full max-w-6xl mx-auto px-6 py-5 flex items-center justify-between border-b border-zinc-800/60 relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-700 to-yellow-500 p-0.5 shadow-lg flex items-center justify-center">
            <span className="text-zinc-950 font-black text-xl">♠</span>
          </div>
          <span className="font-bold text-lg tracking-tight text-white">
            Poker<span className="text-amber-400">Circle</span>
          </span>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-zinc-400">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-amber-300 transition">
            Home
          </button>
          <button onClick={() => setShowRules(true)} className="hover:text-amber-300 transition flex items-center gap-1">
            Rules
          </button>
          <button onClick={() => setShowFaq(true)} className="hover:text-amber-300 transition">
            How It Works & FAQs
          </button>
        </nav>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenJoin}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs uppercase tracking-wider rounded-xl border border-zinc-800 transition active:scale-95"
          >
            Join Table
          </button>
        </div>
      </header>

      {/* ── Main Hero Section ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 max-w-4xl mx-auto w-full text-center relative z-10">
        {/* Hero Title */}
        <h1 className="text-5xl sm:text-7xl font-serif font-black tracking-tight text-white max-w-2xl leading-[1.08]">
          Your Table.<br />
          <span className="text-amber-400">Your Friends.</span><br />
          Your Game.
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-sm sm:text-base text-zinc-400 max-w-lg font-medium leading-relaxed">
          Create a private poker table and invite your friends. No downloads. Just deal.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
          <button
            onClick={onOpenCreate}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-full shadow-2xl transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-zinc-950" />
            Create Table
          </button>

          <button
            onClick={onOpenJoin}
            className="w-full sm:w-auto px-8 py-3.5 bg-zinc-900/80 hover:bg-zinc-800/90 text-white font-bold text-xs uppercase tracking-wider rounded-full border border-zinc-700/80 backdrop-blur-md transition-all duration-200 hover:border-amber-400 active:scale-95 flex items-center justify-center gap-2"
          >
            <Users className="w-4 h-4 text-amber-400" />
            Join Table
          </button>
        </div>

        {/* 3 Trust / Feature Badges matching reference board */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm text-left">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-200">Private Rooms</div>
              <div className="text-[10px] text-zinc-500">Invite-only private tables</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm text-left">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-200">Real-time Play</div>
              <div className="text-[10px] text-zinc-500">Live WebRTC audio & smooth sync</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm text-left">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
              <Coins className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-200">Virtual ₹ Chips</div>
              <div className="text-[10px] text-zinc-500">No real money, purely for fun</div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="w-full border-t border-zinc-900 py-4 px-6 relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono text-zinc-600 max-w-6xl mx-auto">
        <div className="flex items-center gap-1.5 text-zinc-400">
          <span className="text-amber-400">♠</span>
          <span>PokerCircle</span>
        </div>
        <div className="text-center sm:text-right">
          {VIRTUAL_CURRENCY_DISCLAIMER}
        </div>
      </footer>

      {/* Rules Modal */}
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}

      {/* FAQs Modal */}
      {showFaq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative my-auto space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-white text-base">How It Works</h3>
              <button onClick={() => setShowFaq(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-3 text-xs text-zinc-300">
              <p><strong>1. Host a Table:</strong> Tap Create Table, set your virtual starting chips and blinds, and share your 6-letter room code or link.</p>
              <p><strong>2. Invite Friends:</strong> Friends tap Join Table, type the code, and take a seat.</p>
              <p><strong>3. Talk & Play:</strong> Tap the Mic button to talk in real-time while playing No-Limit Texas Hold'em!</p>
              <p><strong>4. Virtual Currency:</strong> All ₹ values are virtual game credits with zero real-world cash value.</p>
            </div>
            <button onClick={() => setShowFaq(false)} className="w-full py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold">
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
