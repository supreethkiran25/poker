import React, { useState } from 'react';
import { Shield, Users, ArrowRight, Play } from 'lucide-react';
import { VIRTUAL_CURRENCY_DISCLAIMER } from '@poker/shared';

interface LandingPageProps {
  initialRoomCode?: string;
  onOpenCreate: () => void;
  onJoinRoom: (code: string, name: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  initialRoomCode = '',
  onOpenCreate,
  onJoinRoom,
}) => {
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [playerName, setPlayerName] = useState(
    () => localStorage.getItem('poker_player_name') || ''
  );

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim() || !playerName.trim()) return;
    onJoinRoom(roomCode.trim().toUpperCase(), playerName.trim());
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#07090e] text-zinc-100 selection:bg-amber-500 selection:text-zinc-950">
      {/* Club Top Navigation Bar */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between border-b border-zinc-800/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 via-amber-700 to-yellow-600 p-0.5 shadow-lg flex items-center justify-center">
            <span className="text-zinc-950 font-black text-xl">♠</span>
          </div>
          <div>
            <div className="font-serif font-black text-xl tracking-tight text-white flex items-center gap-1.5">
              <span>ROYAL</span>
              <span className="text-amber-400">POKER CLUB</span>
            </div>
            <div className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase">
              Private Friends Tables
            </div>
          </div>
        </div>

        <button
          onClick={onOpenCreate}
          className="px-5 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition active:scale-95 flex items-center gap-2"
        >
          <Play className="w-3.5 h-3.5 fill-zinc-950" />
          Host Table
        </button>
      </header>

      {/* Main Club Lounge Entrance */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-4xl mx-auto w-full text-center">
        {/* Table Type Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold mb-5 uppercase tracking-wider">
          <span>No-Limit Texas Hold'em • Virtual ₹ Chips</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-serif font-black tracking-tight text-white max-w-3xl leading-tight">
          THE PRIVATE <span className="text-amber-400">POKER ROOM</span> FOR YOU & YOUR FRIENDS
        </h1>

        <p className="mt-4 text-sm sm:text-base text-zinc-400 max-w-xl font-medium">
          Create a private table with custom blinds and starting chips, share the invite code, and play seamlessly on any device.
        </p>

        {/* Interactive Quick Join & Host Hub */}
        <div className="mt-10 w-full max-w-lg bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400 text-left mb-4 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Join an Existing Table
          </h2>

          <form onSubmit={handleJoinSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-left text-[11px] font-bold uppercase text-zinc-400 mb-1">
                  Table Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={8}
                  placeholder="e.g. H7K9Q"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="w-full bg-zinc-950 border border-zinc-700 text-amber-300 font-mono font-bold text-center uppercase tracking-widest px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-left text-[11px] font-bold uppercase text-zinc-400 mb-1">
                  Your Nickname
                </label>
                <input
                  type="text"
                  required
                  maxLength={16}
                  placeholder="e.g. Rahul"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 text-white font-medium px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!roomCode.trim() || !playerName.trim()}
              className="w-full py-3 mt-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              Enter Table
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-zinc-800"></div>
            <span className="flex-shrink mx-3 text-zinc-500 text-[11px] uppercase font-mono">OR</span>
            <div className="flex-grow border-t border-zinc-800"></div>
          </div>

          <button
            onClick={onOpenCreate}
            className="w-full py-3 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-zinc-700 transition active:scale-95 flex items-center justify-center gap-2"
          >
            Create New Private Table
          </button>
        </div>

        {/* Live Table Stakes Bar */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl text-center font-mono">
          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="text-[10px] text-zinc-500 uppercase">Micro Stakes</div>
            <div className="text-xs font-bold text-amber-300 mt-0.5">₹5 / ₹10</div>
          </div>
          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="text-[10px] text-zinc-500 uppercase">Standard</div>
            <div className="text-xs font-bold text-amber-300 mt-0.5">₹25 / ₹50</div>
          </div>
          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="text-[10px] text-zinc-500 uppercase">Deep Stack</div>
            <div className="text-xs font-bold text-amber-300 mt-0.5">₹50 / ₹100</div>
          </div>
          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="text-[10px] text-zinc-500 uppercase">High Roller</div>
            <div className="text-xs font-bold text-amber-300 mt-0.5">₹250 / ₹500+</div>
          </div>
        </div>
      </main>

      {/* Footer & Responsible Virtual Currency Notice */}
      <footer className="w-full border-t border-zinc-800/80 py-5 px-4 text-center">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono">
            <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{VIRTUAL_CURRENCY_DISCLAIMER}</span>
          </div>
          <div className="text-[11px] text-zinc-600 font-mono">
            Royal Poker Club • Private Friends Texas Hold'em • Virtual Chips Only
          </div>
        </div>
      </footer>
    </div>
  );
};
