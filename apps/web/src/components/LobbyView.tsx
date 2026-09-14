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
    /*
     * Full-height flex column:
     *   - Scrollable content area (flex-1 overflow-y-auto)
     *   - Sticky bottom action bar (flex-shrink-0) — ALWAYS visible, NEVER overlapped
     */
    <div className="flex flex-col w-full min-h-dvh bg-[#07090e]">

      {/* ── Scrollable Content ── */}
      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-4">
        <div className="w-full max-w-lg mx-auto flex flex-col gap-4">

          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="text-[11px] uppercase tracking-widest text-amber-400 font-mono font-bold">
                Private Room
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-300 font-mono font-black text-sm tracking-widest">
                {roomState.code}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Table Waiting Room
            </h1>
            <p className="text-zinc-500 text-xs mt-1 font-mono">
              Share the code or link — friends can join instantly
            </p>
          </div>

          {/* Invite buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 rounded-xl text-xs font-bold border border-zinc-700 transition active:scale-95"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copiedCode ? 'Copied!' : 'Copy Code'}
            </button>
            <button
              onClick={handleCopyLink}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-xl text-xs font-bold border border-amber-500/30 transition active:scale-95"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copiedLink ? 'Copied!' : 'Copy Invite Link'}
            </button>
          </div>

          {/* Virtual currency disclaimer */}
          <div className="p-3 rounded-2xl bg-amber-500/8 border border-amber-500/20 flex items-start gap-2.5 text-xs font-mono text-amber-300/80">
            <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{VIRTUAL_CURRENCY_DISCLAIMER}</span>
          </div>

          {/* Game config grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 bg-zinc-900/70 rounded-2xl border border-zinc-800/80 flex items-center gap-2.5">
              <Coins className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[9px] text-zinc-500 uppercase font-mono tracking-wider">Starting Stack</div>
                <div className="text-sm font-black text-white font-mono truncate">
                  {formatRupee(roomState.config.startingChips)}
                </div>
              </div>
            </div>

            <div className="p-3 bg-zinc-900/70 rounded-2xl border border-zinc-800/80 flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[9px] text-zinc-500 uppercase font-mono tracking-wider">Blinds</div>
                <div className="text-sm font-black text-white font-mono truncate">
                  {formatRupee(roomState.config.smallBlind)} / {formatRupee(roomState.config.bigBlind)}
                </div>
              </div>
            </div>

            <div className="p-3 bg-zinc-900/70 rounded-2xl border border-zinc-800/80 flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div>
                <div className="text-[9px] text-zinc-500 uppercase font-mono tracking-wider">Turn Timer</div>
                <div className="text-sm font-black text-white font-mono">{roomState.config.turnTimerSeconds}s</div>
              </div>
            </div>

            <div className="p-3 bg-zinc-900/70 rounded-2xl border border-zinc-800/80 flex items-center gap-2.5">
              <Users className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div>
                <div className="text-[9px] text-zinc-500 uppercase font-mono tracking-wider">Players</div>
                <div className="text-sm font-black text-white font-mono">
                  {roomState.players.length} / {roomState.config.maxPlayers}
                </div>
              </div>
            </div>
          </div>

          {/* Seated players */}
          <div>
            <h2 className="text-[11px] uppercase tracking-wider text-zinc-500 font-bold mb-2 px-1">
              Seated Players ({roomState.players.length})
            </h2>
            <div className="flex flex-col gap-2">
              {roomState.players.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-colors ${
                    p.id === myPlayerId
                      ? 'bg-emerald-950/30 border-emerald-800/50'
                      : 'bg-zinc-900/60 border-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center font-black text-zinc-950 text-sm flex-shrink-0">
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-sm text-zinc-100 truncate">{p.name}</span>
                        {p.id === myPlayerId && (
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold flex-shrink-0">
                            YOU
                          </span>
                        )}
                        {p.isHost && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-mono font-bold flex-shrink-0">
                            HOST
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-amber-300/80 font-mono mt-0.5">
                        {formatRupee(p.chips)} virtual chips
                      </div>
                    </div>
                  </div>

                  {/* Ready status */}
                  <div className="flex-shrink-0 ml-2">
                    {p.isReady ? (
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/40">
                        READY
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-500 font-bold text-xs border border-zinc-700">
                        WAITING
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* Empty seats hint */}
              {roomState.players.length < 2 && (
                <div className="p-4 rounded-2xl border border-dashed border-zinc-800 text-center">
                  <p className="text-xs text-zinc-600 font-mono">
                    Waiting for at least 1 more player to join…
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── STICKY BOTTOM ACTION BAR — always visible, never scrolled away ── */}
      <div
        className="flex-shrink-0 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/80 px-4 pt-3"
        style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))' }}
      >
        <div className="w-full max-w-lg mx-auto flex flex-col gap-2.5">
          {/* Ready toggle */}
          <button
            onClick={() => onToggleReady(!me?.isReady)}
            className={`w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider transition active:scale-[0.98] ${
              me?.isReady
                ? 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg border border-emerald-400/60'
            }`}
          >
            {me?.isReady ? "I'm Not Ready" : "I'm Ready ✓"}
          </button>

          {/* Host: Start Game */}
          {isHost && (
            <button
              disabled={!allReady}
              onClick={onStartGame}
              className="w-full py-3.5 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 disabled:opacity-35 disabled:cursor-not-allowed text-zinc-950 font-black rounded-xl shadow-xl transition active:scale-[0.98] text-sm uppercase tracking-wider"
            >
              <Play className="w-4 h-4 fill-zinc-950" />
              {allReady ? 'Start Game' : `Waiting for players to ready up…`}
            </button>
          )}

          {/* Leave */}
          <button
            onClick={onLeaveRoom}
            className="w-full py-2.5 flex items-center justify-center gap-2 text-zinc-500 hover:text-rose-400 text-xs font-bold transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            Leave Table
          </button>
        </div>
      </div>
    </div>
  );
};
