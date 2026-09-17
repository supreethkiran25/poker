import React, { useState } from 'react';
import {
  Shield,
  Zap,
  Coins,
  Users,
  Play,
  BookOpen,
  Bot,
  Sparkles,
  X,
  Check,
} from 'lucide-react';
import type { BotDifficulty } from '@poker/shared';
import { VIRTUAL_CURRENCY_DISCLAIMER } from '@poker/shared';
import { RulesModal } from '../components/RulesModal.js';

interface LandingPageProps {
  initialRoomCode?: string;
  playerName?: string;
  onQuickPlayBots: (botCount?: number, difficulty?: BotDifficulty | 'mixed') => void;
  onOpenCreate: () => void;
  onOpenJoin: () => void;
  onJoinRoom: (code: string, name: string, buyIn?: number) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  initialRoomCode = '',
  playerName = 'Player',
  onQuickPlayBots,
  onOpenCreate,
  onOpenJoin,
  onJoinRoom,
}) => {
  const [showRules, setShowRules] = useState(false);
  const [showFaq, setShowFaq] = useState(false);
  const [showPlayModal, setShowPlayModal] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<BotDifficulty | 'mixed'>('mixed');
  const [selectedBotCount, setSelectedBotCount] = useState<number>(5);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#06080d] text-zinc-100 selection:bg-amber-500 selection:text-zinc-950 relative overflow-hidden">
      {/* ── Luxury Atmospheric Poker Background ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src="/poker_hero_bg.jpg"
          alt="Luxury Poker Lounge"
          width={1376}
          height={768}
          // @ts-expect-error React 18 types fetchpriority as fetchPriority
          fetchpriority="high"
          fetchPriority="high"
          decoding="async"
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

        {/* Center Nav Links matching Screen 1 */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-zinc-400">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-white font-bold hover:text-amber-300 transition"
          >
            Home
          </button>
          <button
            onClick={() => setShowFaq(true)}
            className="hover:text-amber-300 transition"
          >
            How It Works
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
            FAQs
          </button>
        </nav>

        {/* Right Nav Action */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPlayModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-full shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all duration-200 active:scale-95 group"
          >
            <Play className="w-3.5 h-3.5 fill-zinc-950 group-hover:scale-110 transition-transform" />
            <span>Play Now</span>
          </button>
        </div>
      </header>

      {/* ── Main Hero Section ── */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-16 lg:py-24 flex flex-col items-center justify-center text-center relative z-10">
        {/* Tagline Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold mb-6 tracking-wider backdrop-blur-md">
          <span>♠ PRIVATE LIVE TEXAS HOLD'EM</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-7xl font-serif font-black tracking-tight text-white leading-[1.08]">
          Your Table.<br />
          <span className="text-amber-400">Your Friends.</span> Your Game.
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-xl text-zinc-300 font-normal leading-relaxed max-w-2xl mx-auto">
          Create a private poker table, play with friends, or jump right into an instant match against smart AI bots. No downloads. Just deal.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 w-full sm:w-auto">
          {/* Primary 1-Click Action: Play vs Bots */}
          <button
            onClick={() => setShowPlayModal(true)}
            className="px-8 py-4 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-zinc-950 font-black text-sm uppercase tracking-wider rounded-full shadow-2xl shadow-amber-500/30 transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2.5 group"
          >
            <div className="w-6 h-6 rounded-full bg-zinc-950/15 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-3.5 h-3.5 fill-zinc-950 translate-x-0.5" />
            </div>
            <span>Play Now</span>
          </button>

          {/* Create Table */}
          <button
            onClick={onOpenCreate}
            className="px-7 py-4 bg-zinc-900/90 hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider rounded-full border border-zinc-700/80 backdrop-blur-md transition-all duration-200 hover:border-amber-400/60 active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Create Table</span>
          </button>

          {/* Join Table */}
          <button
            onClick={onOpenJoin}
            className="px-7 py-4 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-wider rounded-full border border-zinc-800 backdrop-blur-md transition-all duration-200 hover:border-zinc-600 active:scale-95 flex items-center justify-center gap-2"
          >
            <Users className="w-4 h-4 text-zinc-400" />
            <span>Join Table</span>
          </button>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs font-mono text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Instant 1-Click Game • No setup • Auto-seated with AI bots</span>
        </div>

        {/* 3 Trust / Feature Badges */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl mx-auto">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 backdrop-blur-md text-left">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-200">Private Rooms</div>
              <div className="text-xs text-zinc-400">Invite-only tables</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 backdrop-blur-md text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-200">Instant AI Bots</div>
              <div className="text-xs text-zinc-400">Play anytime solo</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 backdrop-blur-md text-left">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-200">Virtual ₹ Chips</div>
              <div className="text-xs text-zinc-400">No real money</div>
            </div>
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

      {/* ── Quick Play vs Bots Match Setup Modal ── */}
      {showPlayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in pointer-events-auto">
          <div className="absolute inset-0" onClick={() => setShowPlayModal(false)} />
          <div className="relative w-full max-w-lg bg-[#090d16] border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-2xl z-10 animate-scale-up text-zinc-100 flex flex-col gap-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">Play Against AI Bots</h3>
                  <p className="text-xs text-zinc-400">Choose bot skill level and table size</p>
                </div>
              </div>
              <button
                onClick={() => setShowPlayModal(false)}
                className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 transition active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1. Skill Level Selector */}
            <div className="space-y-2.5">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
                1. Select AI Difficulty Level
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {/* Easy */}
                <button
                  onClick={() => setSelectedDifficulty('easy')}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between gap-1.5 ${
                    selectedDifficulty === 'easy'
                      ? 'bg-emerald-950/60 border-emerald-500/60 ring-2 ring-emerald-500/40'
                      : 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Easy
                    </span>
                    {selectedDifficulty === 'easy' && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <span className="text-[11px] text-zinc-400 leading-snug">
                    Calling stations. Relaxed play & easy to beat.
                  </span>
                </button>

                {/* Medium */}
                <button
                  onClick={() => setSelectedDifficulty('medium')}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between gap-1.5 ${
                    selectedDifficulty === 'medium'
                      ? 'bg-amber-950/60 border-amber-500/60 ring-2 ring-amber-500/40'
                      : 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-amber-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      Medium
                    </span>
                    {selectedDifficulty === 'medium' && <Check className="w-4 h-4 text-amber-400" />}
                  </div>
                  <span className="text-[11px] text-zinc-400 leading-snug">
                    Balanced ABC poker. Solid fundamentals.
                  </span>
                </button>

                {/* Hard */}
                <button
                  onClick={() => setSelectedDifficulty('hard')}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between gap-1.5 ${
                    selectedDifficulty === 'hard'
                      ? 'bg-rose-950/60 border-rose-500/60 ring-2 ring-rose-500/40'
                      : 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-rose-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                      Hard
                    </span>
                    {selectedDifficulty === 'hard' && <Check className="w-4 h-4 text-rose-400" />}
                  </div>
                  <span className="text-[11px] text-zinc-400 leading-snug">
                    Table Sharks. Relentless 3-bets & aggression.
                  </span>
                </button>

                {/* Mixed */}
                <button
                  onClick={() => setSelectedDifficulty('mixed')}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between gap-1.5 ${
                    selectedDifficulty === 'mixed'
                      ? 'bg-purple-950/60 border-purple-500/60 ring-2 ring-purple-500/40'
                      : 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-purple-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      Mixed (Casino)
                    </span>
                    {selectedDifficulty === 'mixed' && <Check className="w-4 h-4 text-purple-400" />}
                  </div>
                  <span className="text-[11px] text-zinc-400 leading-snug">
                    Dynamic mix of all styles like real poker.
                  </span>
                </button>
              </div>
            </div>

            {/* 2. Number of Bots Selector */}
            <div className="space-y-2.5">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
                2. Select Table Size (Machine Bots)
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { count: 3, label: '3 Bots', sub: '4-Max Table' },
                  { count: 5, label: '5 Bots', sub: '6-Max Classic' },
                  { count: 7, label: '7 Bots', sub: '8-Max Full Ring' },
                ].map((item) => (
                  <button
                    key={item.count}
                    onClick={() => setSelectedBotCount(item.count)}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                      selectedBotCount === item.count
                        ? 'bg-amber-500/20 border-amber-500/60 ring-2 ring-amber-500/40 text-amber-300'
                        : 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <span className="font-black text-sm">{item.label}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">{item.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* CTA Button: Start Game */}
            <div className="pt-2">
              <button
                onClick={() => {
                  setShowPlayModal(false);
                  onQuickPlayBots(selectedBotCount, selectedDifficulty);
                }}
                className="w-full py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-zinc-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-amber-500/20 hover:shadow-amber-500/30 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 group"
              >
                <Play className="w-4 h-4 fill-zinc-950 group-hover:scale-110 transition-transform" />
                <span>Deal Cards & Play Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
