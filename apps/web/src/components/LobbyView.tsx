import React, { useState } from 'react';
import type { RoomPublicState } from '@poker/shared';
import { formatRupee, VIRTUAL_CURRENCY_DISCLAIMER } from '@poker/shared';
import { Copy, Check, Play, LogOut, Users, Shield, Clock, Coins } from 'lucide-react';

interface LobbyViewProps {
  roomState: RoomPublicState;
  myPlayerId: string;
  onToggleReady: (ready: boolean) => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  roomState,
  myPlayerId,
  onToggleReady,
  onStartGame,
  onLeaveRoom,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const me = roomState.players.find((p) => p.id === myPlayerId);
  const isHost = me?.isHost ?? false;
  const allReady = roomState.players.length >= 2 && roomState.players.every((p) => p.isReady);

  const inviteUrl = `${window.location.origin}/room/${roomState.code}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomState.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-zinc-950/90 backdrop-blur-xl border border-amber-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-5">
        {/* Header with Room Code & Invite Link */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-xs uppercase tracking-widest text-amber-400 font-mono font-bold">
                Private Room
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono font-bold text-xs">
                {roomState.code}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Table Waiting Room
            </h1>
          </div>

          {/* Copy Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-bold border border-zinc-700 transition"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedCode ? 'Code Copied!' : 'Copy Code'}
            </button>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-xl text-xs font-bold border border-amber-500/30 transition"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedLink ? 'Link Copied!' : 'Copy Invite Link'}
            </button>
          </div>
        </div>

        {/* Responsible Gaming Disclaimer */}
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2.5 text-xs font-mono text-amber-300/90">
          <Shield className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{VIRTUAL_CURRENCY_DISCLAIMER}</span>
        </div>

        {/* Game Settings Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-zinc-900/60 rounded-2xl border border-zinc-800/80 flex items-center gap-3">
            <Coins className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-[10px] text-zinc-400 uppercase font-mono">Virtual Starting Stack</div>
              <div className="text-sm font-bold text-white font-mono">
                {formatRupee(roomState.config.startingChips)}
              </div>
            </div>
          </div>

          <div className="p-3 bg-zinc-900/60 rounded-2xl border border-zinc-800/80 flex items-center gap-3">
            <Shield className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-[10px] text-zinc-400 uppercase font-mono">Virtual Blinds</div>
              <div className="text-sm font-bold text-white font-mono">
                {formatRupee(roomState.config.smallBlind)} / {formatRupee(roomState.config.bigBlind)}
              </div>
            </div>
          </div>

          <div className="p-3 bg-zinc-900/60 rounded-2xl border border-zinc-800/80 flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-[10px] text-zinc-400 uppercase font-mono">Turn Timer</div>
              <div className="text-sm font-bold text-white font-mono">
                {roomState.config.turnTimerSeconds}s
              </div>
            </div>
          </div>

          <div className="p-3 bg-zinc-900/60 rounded-2xl border border-zinc-800/80 flex items-center gap-3">
            <Users className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-[10px] text-zinc-400 uppercase font-mono">Players</div>
              <div className="text-sm font-bold text-white font-mono">
                {roomState.players.length} / {roomState.config.maxPlayers}
              </div>
            </div>
          </div>
        </div>

        {/* Seated Players List */}
        <div>
          <h2 className="text-xs uppercase tracking-wider text-zinc-400 font-bold mb-3">
            Seated Players ({roomState.players.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {roomState.players.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 p-0.5 flex items-center justify-center font-bold text-zinc-950 text-xs">
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-zinc-100">{p.name}</span>
                      {p.id === myPlayerId && (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold">
                          YOU
                        </span>
                      )}
                      {p.isHost && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-mono font-bold">
                          HOST
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-amber-300 font-mono">
                      Virtual Balance: {formatRupee(p.chips)}
                    </div>
                  </div>
                </div>

                {/* Ready indicator */}
                <div>
                  {p.isReady ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/40">
                      READY
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 font-bold text-xs border border-zinc-700">
                      WAITING
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 border-t border-zinc-800">
          <button
            onClick={onLeaveRoom}
            className="flex items-center gap-2 px-4 py-2.5 text-zinc-400 hover:text-rose-400 text-xs font-bold transition"
          >
            <LogOut className="w-4 h-4" />
            Leave Table
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Ready Toggle Button */}
            <button
              onClick={() => onToggleReady(!me?.isReady)}
              className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition ${
                me?.isReady
                  ? 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg border border-emerald-400'
              }`}
            >
              {me?.isReady ? 'Unready' : "I'm Ready"}
            </button>

            {/* Host Start Game Button */}
            {isHost && (
              <button
                disabled={!allReady}
                onClick={onStartGame}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-black rounded-xl shadow-xl transition active:scale-95 text-xs uppercase tracking-wider"
              >
                <Play className="w-4 h-4 fill-zinc-950" />
                Start Game
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
