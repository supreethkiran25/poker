import React, { useState } from 'react';
import { Shield, Zap, Coins, Users, Play, ArrowRight, BookOpen, Crown } from 'lucide-react';
import { VIRTUAL_CURRENCY_DISCLAIMER, formatRupee } from '@poker/shared';
import { RulesModal } from '../components/RulesModal.js';
import { CardView } from '../components/CardView.js';

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
    <div className="min-h-screen flex flex-col justify-between bg-[#06080d] text-zinc-100 selection:bg-amber-500 selection:text-zinc-950 relative overflow-hidden">
      {/* ── Luxury Atmospheric Poker Background ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src="/poker_hero_bg.jpg"
          alt="Luxury Poker Lounge"
          className="w-full h-full object-cover object-center opacity-35 filter brightness-75 scale-105 transition-transform duration-1000"
        />
        {/* Dark radial and gradient vignettes */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#06080d] via-[#06080d]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#06080d] via-[#06080d]/70 to-transparent" />
        <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* ── Top Navigation Bar ── */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-zinc-800/50 backdrop-blur-md relative z-10">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-700 to-yellow-500 p-0.5 shadow-xl flex items-center justify-center">
            <span className="text-zinc-950 font-black text-xl leading-none">♠</span>
          </div>
          <span className="font-serif font-black text-xl tracking-tight text-white">
            Poker<span className="text-amber-400">Circle</span>
          </span>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-zinc-400">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="hover:text-amber-300 transition"
          >
            Home
          </button>
          <button
            onClick={() => setShowRules(true)}
            className="hover:text-amber-300 transition"
          >
            Rules
          </button>
          <button
            onClick={() => setShowFaq(true)}
            className="hover:text-amber-300 transition"
          >
            How It Works & FAQs
          </button>
        </nav>

        {/* Header CTA Button */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenJoin}
            className="px-4 py-2 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 font-bold text-xs uppercase tracking-wider rounded-xl border border-zinc-800 backdrop-blur-sm transition active:scale-95"
          >
            Join Table
          </button>
        </div>
      </header>

      {/* ── Main Hero Section (Matching Screen 1) ── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 lg:py-20 flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
        {/* Left Column: Headline, Subtitle, CTAs & Trust Badges */}
        <div className="flex-1 text-center lg:text-left max-w-2xl">
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold mb-6 tracking-wide backdrop-blur-md">
            <span>♠ PRIVATE LIVE TEXAS HOLD'EM</span>
          </div>

          {/* Headline (Screen 1 Reference) */}
          <h1 className="text-5xl sm:text-7xl font-serif font-black tracking-tight text-white leading-[1.06]">
            Your Table.<br />
            <span className="text-amber-400">Your Friends.</span><br />
            Your Game.
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg text-zinc-400 font-normal leading-relaxed max-w-xl mx-auto lg:mx-0">
            Create a private poker table and invite your friends. No downloads. Just deal.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <button
              onClick={onOpenCreate}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-full shadow-2xl transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2.5"
            >
              <Play className="w-4 h-4 fill-zinc-950" />
              <span>Create Table</span>
            </button>

            <button
              onClick={onOpenJoin}
              className="w-full sm:w-auto px-8 py-4 bg-zinc-900/90 hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider rounded-full border border-zinc-700/80 backdrop-blur-md transition-all duration-200 hover:border-amber-400 active:scale-95 flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4 text-amber-400" />
              <span>Join Table</span>
            </button>
          </div>

          {/* 3 Trust / Feature Badges (Matching Screen 1) */}
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-xl mx-auto lg:mx-0">
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 backdrop-blur-md text-left">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-200">Private Rooms</div>
                <div className="text-[10px] text-zinc-500">Invite-only private tables</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 backdrop-blur-md text-left">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-200">Real-time Play</div>
                <div className="text-[10px] text-zinc-500">Live WebRTC voice & smooth sync</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 backdrop-blur-md text-left">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                <Coins className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-200">Virtual ₹ Chips</div>
                <div className="text-[10px] text-zinc-500">No real money, purely for fun</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Luxury Table Preview Card */}
        <div className="w-full lg:w-auto flex justify-center">
          <div className="w-full max-w-md bg-zinc-950/85 backdrop-blur-2xl border border-zinc-800/90 rounded-3xl p-6 shadow-2xl relative">
            {/* Header info */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                  Live Table #K7Q9XM
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                ₹50 / ₹100 Blinds
              </span>
            </div>

            {/* Mini Table Felt Showcase */}
            <div className="my-5 p-4 rounded-2xl bg-gradient-to-b from-[#082918] to-[#04180e] border border-emerald-500/30 relative flex flex-col items-center justify-center overflow-hidden shadow-inner min-h-[160px]">
              {/* Pot badge */}
              <div className="mb-3 px-3 py-1 bg-black/80 rounded-full border border-amber-500/40 text-[11px] font-mono font-bold text-amber-300 flex items-center gap-1.5 shadow">
                <span className="text-[9px] text-amber-500">POT</span>
                <span>|</span>
                <span>₹12,450</span>
              </div>

              {/* Royal Flush Showcase community cards */}
              <div className="flex items-center gap-1.5">
                <CardView card={{ suit: 's', rank: 14, id: 'As' }} size="sm" dealDelayMs={0} />
                <CardView card={{ suit: 's', rank: 13, id: 'Ks' }} size="sm" dealDelayMs={100} />
                <CardView card={{ suit: 's', rank: 12, id: 'Qs' }} size="sm" dealDelayMs={200} />
                <CardView card={{ suit: 's', rank: 11, id: 'Js' }} size="sm" dealDelayMs={300} />
                <CardView card={{ suit: 's', rank: 10, id: '10s' }} size="sm" dealDelayMs={400} />
              </div>
              <div className="text-[9px] font-mono font-bold text-amber-300 mt-2 uppercase tracking-widest">
                Royal Flush
              </div>
            </div>

            {/* Seated Friends Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1 font-mono">
                <span>Active Friends (3/6)</span>
                <span className="text-emerald-400">● Live Mic Talking</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-800">
                  <div className="font-bold text-zinc-200">Alex</div>
                  <div className="text-[10px] font-mono text-amber-300">₹14,850</div>
                </div>
                <div className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-800">
                  <div className="font-bold text-zinc-200">Rahul</div>
                  <div className="text-[10px] font-mono text-amber-300">₹7,200</div>
                </div>
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <div className="font-bold text-amber-300">You</div>
                  <div className="text-[10px] font-mono text-amber-200">₹11,350</div>
                </div>
              </div>
            </div>

            {/* Quick Action */}
            <button
              onClick={onOpenCreate}
              className="w-full mt-4 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition active:scale-95 flex items-center justify-center gap-1.5 shadow-lg"
            >
              <span>Host Your Own Game</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="w-full border-t border-zinc-900/80 py-5 px-6 relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono text-zinc-500 max-w-7xl mx-auto backdrop-blur-md">
        <div className="flex items-center gap-2 text-zinc-300">
          <span className="text-amber-400 font-bold">♠</span>
          <span className="font-bold">PokerCircle</span>
          <span className="text-zinc-600">•</span>
          <span>Private Online Poker with Friends</span>
        </div>
        <div className="text-center sm:text-right max-w-md">
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
              <p><strong>3. Talk & Play:</strong> Tap the Mic button to talk in real-time with WebRTC live audio!</p>
              <p><strong>4. Virtual Currency:</strong> All ₹ values are virtual game credits with zero real-world monetary value.</p>
            </div>
            <button onClick={() => setShowFaq(false)} className="w-full py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-bold">
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
