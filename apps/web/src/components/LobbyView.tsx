import React, { useState } from 'react';
import type { RoomPublicState } from '@poker/shared';
import { formatRupee, VIRTUAL_CURRENCY_DISCLAIMER } from '@poker/shared';
import {
  Copy,
  Check,
  Play,
  LogOut,
  Users,
  Shield,
  Clock,
  Coins,
  Share2,
  Mic,
  MicOff,
  Sparkles,
  Crown,
} from 'lucide-react';

interface LobbyViewProps {
  roomState: RoomPublicState;
  myPlayerId: string;
  isVoiceActive?: boolean;
  isMuted?: boolean;
  speakingPeers?: Record<string, boolean>;
  onToggleMute?: () => void;
  onToggleReady: (ready: boolean) => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  roomState,
  myPlayerId,
  isVoiceActive = false,
  isMuted = false,
  speakingPeers = {},
  onToggleMute,
  onToggleReady,
  onStartGame,
  onLeaveRoom,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const me = roomState.players.find((p) => p.id === myPlayerId);
  const isHost = me?.isHost ?? false;
  const isReady = me?.isReady ?? false;
  const playerCount = roomState.players.length;
  const canStart = isHost && playerCount >= 2;

  const copyCode = () => {
    navigator.clipboard.writeText(roomState.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyLink = () => {
    const url = `${window.location.origin}/room/${roomState.code}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/room/${roomState.code}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join my private Poker Table: ${roomState.code}`,
          text: `Play Texas Hold'em with me on PokerCircle! Room code: ${roomState.code}`,
          url,
        });
      } catch (err) {}
    } else {
      copyLink();
    }
  };

  return (
    <div className="relative min-h-dvh flex flex-col bg-[#07090e] text-zinc-100 selection:bg-amber-500 selection:text-zinc-950">
      {/* ── Screen 4: Top Header ── */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-4 sm:px-8 py-3.5 sticky top-0 z-30 flex items-center justify-between">
        {/* Left: Private Table + Room Code Badge + Copy Link Button */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 via-amber-700 to-yellow-500 p-0.5 shadow flex items-center justify-center">
            <span className="text-zinc-950 font-black text-sm">♠</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
              Private Table
            </span>
            <span className="font-mono font-bold text-emerald-400 text-xs tracking-widest px-2.5 py-1 bg-emerald-950/80 rounded-lg border border-emerald-500/40">
              {roomState.code}
            </span>
          </div>

          <button
            onClick={copyLink}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-zinc-900 hover:bg-zinc-800 rounded-lg border border-zinc-700/80 text-xs font-mono text-zinc-300 hover:text-white transition active:scale-95"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
            <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
          </button>
        </div>

        {/* Header Actions: Mic toggle + Share + Leave */}
        <div className="flex items-center gap-2">
          {onToggleMute && (
            <button
              onClick={onToggleMute}
              className={`p-2 rounded-xl border transition flex items-center gap-1.5 ${
                isVoiceActive && !isMuted
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
              title={isVoiceActive && !isMuted ? 'Mute Mic' : 'Unmute Mic'}
            >
              {isVoiceActive && !isMuted ? (
                <>
                  <Mic className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-mono font-bold hidden sm:inline">TALKING</span>
                </>
              ) : (
                <>
                  <MicOff className="w-4 h-4 text-rose-400" />
                  <span className="text-[10px] font-mono font-bold hidden sm:inline">MUTED</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={handleShare}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl border border-zinc-800 transition"
            title="Share Table"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            onClick={onLeaveRoom}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 rounded-xl border border-zinc-800 transition"
            title="Leave Table"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Screen 4: Horizontal 4-Stat Bar ── */}
      <div className="border-b border-zinc-800/60 bg-zinc-950/40 px-4 sm:px-8 py-2.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between sm:justify-start gap-4 sm:gap-8 overflow-x-auto text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-zinc-200 font-bold">Texas Hold'em</span>
          </div>
          <span className="text-zinc-700 hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-zinc-200 font-bold">
              {formatRupee(roomState.config.smallBlind)} / {formatRupee(roomState.config.bigBlind)}
            </span>
            <span className="text-zinc-500 text-[11px]">Blinds</span>
          </div>
          <span className="text-zinc-700 hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-amber-300 font-bold">
              {formatRupee(roomState.config.startingChips)}
            </span>
            <span className="text-zinc-500 text-[11px]">Starting Stack</span>
          </div>
          <span className="text-zinc-700 hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-zinc-200 font-bold">{roomState.config.turnTimerSeconds}s</span>
            <span className="text-zinc-500 text-[11px]">Turn Timer</span>
          </div>
        </div>
      </div>

      {/* ── Screen 4: 2-Column Main Workspace ── */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left 2 Columns: Seated Players List */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-400 px-1">
              <span>Seated Players ({playerCount})</span>
              <span className="text-[11px] text-zinc-500 font-mono">Min 2 to start</span>
            </div>

            <div className="space-y-2.5">
              {roomState.players.map((p) => {
                const isMe = p.id === myPlayerId;
                const isSpeaking = isMe ? !isMuted : !!speakingPeers[p.id];

                return (
                  <div
                    key={p.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isMe
                        ? 'bg-zinc-900/90 border-amber-500/40 ring-1 ring-amber-500/20'
                        : 'bg-zinc-900/50 border-zinc-800/80 hover:bg-zinc-900/70'
                    }`}
                  >
                    {/* Left: Avatar + Details */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative">
                        {isSpeaking && (
                          <span className="absolute -inset-1 rounded-full bg-emerald-500/40 animate-ping" />
                        )}
                        <div
                          className={`w-11 h-11 rounded-full bg-gradient-to-tr from-amber-600 via-amber-700 to-yellow-500 p-0.5 shadow flex items-center justify-center ${
                            isSpeaking ? 'ring-2 ring-emerald-400' : ''
                          }`}
                        >
                          <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center font-bold text-sm text-amber-300">
                            {p.name.slice(0, 2).toUpperCase()}
                          </div>
                        </div>
                        {/* Connection dot */}
                        <span
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-zinc-950 ${
                            p.isConnected ? 'bg-emerald-500' : 'bg-red-500'
                          }`}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white truncate">{p.name}</span>
                          {isMe && (
                            <span className="text-[9px] font-mono font-black bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-400 font-mono mt-0.5">
                          Chips: <span className="text-amber-300 font-bold">{formatRupee(p.chips)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Readiness Badge (Screen 4 Green Badge) */}
                    <div>
                      {p.isHost ? (
                        <span className="px-3 py-1 bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 rounded-lg text-xs font-mono font-bold flex items-center gap-1">
                          <Crown className="w-3 h-3" />
                          <span>HOST • {p.isReady ? 'READY' : 'READY'}</span>
                        </span>
                      ) : p.isReady ? (
                        <span className="px-3 py-1 bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 rounded-lg text-xs font-mono font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>READY</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-zinc-800/80 border border-zinc-700/60 text-zinc-400 rounded-lg text-xs font-mono font-bold">
                          WAITING
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right 1 Column: Dedicated Card with Player Count + Start Game */}
          <div className="md:col-span-1">
            <div className="sticky top-24 p-5 rounded-3xl bg-zinc-900/60 border border-zinc-800 flex flex-col gap-4">
              <div className="text-center pb-2 border-b border-zinc-800/60">
                <div className="text-2xl font-bold font-mono text-white">
                  {playerCount}/{roomState.config.maxPlayers} Players
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  {playerCount >= 2 ? 'Table ready to deal' : 'Need at least 2 players'}
                </div>
              </div>

              {/* Ready Toggle for Non-Host / Player */}
              <button
                onClick={() => onToggleReady(!isReady)}
                className={`w-full py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition active:scale-95 flex items-center justify-center gap-2 ${
                  isReady
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>{isReady ? 'Ready ✓' : "I'm Ready"}</span>
              </button>

              {/* Invite Friends Button */}
              <button
                onClick={handleShare}
                className="w-full py-3 bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 font-bold text-xs uppercase tracking-wider rounded-2xl border border-zinc-700 transition active:scale-95 flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4 text-amber-400" />
                <span>Invite Friends</span>
              </button>

              {/* Start Game Solid Gold Button (Screen 4) */}
              {isHost ? (
                <button
                  onClick={onStartGame}
                  disabled={!canStart}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-zinc-950" />
                  <span>Start Game</span>
                </button>
              ) : (
                <div className="text-center text-[11px] text-zinc-500 font-mono py-2">
                  Waiting for host to start the table…
                </div>
              )}

              {/* Virtual chip disclaimer */}
              <div className="pt-2 border-t border-zinc-800/60 text-[10px] text-zinc-500 font-mono text-center flex items-center justify-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Virtual chips only. No real money.</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer disclaimer */}
      <footer className="w-full border-t border-zinc-900 py-3 text-center text-[11px] font-mono text-zinc-500">
        ♠ PokerCircle • ₹ values are virtual game credits and have no real-world monetary value.
      </footer>
    </div>
  );
};
