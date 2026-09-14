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
      {/* ── Top Header ── */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-md px-4 py-3 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-700 to-yellow-500 p-0.5 shadow flex items-center justify-center">
            <span className="text-zinc-950 font-black text-sm">♠</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Private Table
              </span>
              <span className="font-mono font-black text-amber-400 text-sm tracking-widest px-2 py-0.5 bg-amber-500/10 rounded-md border border-amber-500/30">
                {roomState.code}
              </span>
            </div>
          </div>
        </div>

        {/* Header Actions: Mic toggle + Share + Leave */}
        <div className="flex items-center gap-1.5">
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

      {/* ── Scrollable Body ── */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-5 flex flex-col gap-4 pb-36">
        {/* Quick invite buttons */}
        <div className="flex gap-2">
          <button
            onClick={copyCode}
            className="flex-1 py-2.5 px-3 bg-zinc-900/90 hover:bg-zinc-800 rounded-2xl border border-zinc-800 text-xs font-mono font-bold flex items-center justify-center gap-2 transition active:scale-95"
          >
            {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
            <span>{copiedCode ? 'Code Copied!' : `Copy Code (${roomState.code})`}</span>
          </button>

          <button
            onClick={copyLink}
            className="flex-1 py-2.5 px-3 bg-zinc-900/90 hover:bg-zinc-800 rounded-2xl border border-zinc-800 text-xs font-mono font-bold flex items-center justify-center gap-2 transition active:scale-95 text-amber-300"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-amber-400" />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Invite Link'}</span>
          </button>
        </div>

        {/* Currency disclaimer */}
        <div className="p-3 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 text-[11px] font-mono text-zinc-400 flex items-center gap-2.5">
          <Shield className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="leading-snug">{VIRTUAL_CURRENCY_DISCLAIMER}</span>
        </div>

        {/* Table Stats Pills matching Screen 4 in design image */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col items-center">
            <Coins className="w-4 h-4 text-amber-400 mb-1" />
            <span className="text-[10px] text-zinc-500 uppercase font-mono">Starting Stack</span>
            <span className="text-xs font-bold font-mono text-amber-300 mt-0.5">
              {formatRupee(roomState.config.startingChips)}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col items-center">
            <Shield className="w-4 h-4 text-emerald-400 mb-1" />
            <span className="text-[10px] text-zinc-500 uppercase font-mono">Blinds</span>
            <span className="text-xs font-bold font-mono text-white mt-0.5">
              {formatRupee(roomState.config.smallBlind)} / {formatRupee(roomState.config.bigBlind)}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col items-center">
            <Clock className="w-4 h-4 text-blue-400 mb-1" />
            <span className="text-[10px] text-zinc-500 uppercase font-mono">Turn Timer</span>
            <span className="text-xs font-bold font-mono text-white mt-0.5">
              {roomState.config.turnTimerSeconds}s
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col items-center">
            <Users className="w-4 h-4 text-purple-400 mb-1" />
            <span className="text-[10px] text-zinc-500 uppercase font-mono">Players</span>
            <span className="text-xs font-bold font-mono text-white mt-0.5">
              {playerCount} / {roomState.config.maxPlayers}
            </span>
          </div>
        </div>

        {/* Seated Players List matching Screen 4 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-400 px-1">
            <span>Seated Players ({playerCount})</span>
            <span className="text-[10px] text-zinc-500">Min 2 to start</span>
          </div>

          <div className="space-y-2">
            {roomState.players.map((p) => {
              const isMe = p.id === myPlayerId;
              const isSpeaking = isMe ? !isMuted : !!speakingPeers[p.id];

              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isMe
                      ? 'bg-zinc-900/90 border-amber-500/40 ring-1 ring-amber-500/20'
                      : 'bg-zinc-900/50 border-zinc-800/80'
                  }`}
                >
                  {/* Left: Avatar + Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      {isSpeaking && (
                        <span className="absolute -inset-1 rounded-full bg-emerald-500/40 animate-ping" />
                      )}
                      <div
                        className={`w-10 h-10 rounded-full bg-gradient-to-tr from-amber-600 via-amber-700 to-yellow-500 p-0.5 shadow flex items-center justify-center ${
                          isSpeaking ? 'ring-2 ring-emerald-400' : ''
                        }`}
                      >
                        <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center font-bold text-sm text-amber-300">
                          {p.name.slice(0, 2).toUpperCase()}
                        </div>
                      </div>
                      {/* Connection status */}
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-zinc-950 ${
                          p.isConnected ? 'bg-emerald-500' : 'bg-red-500'
                        }`}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-sm text-zinc-100 truncate">{p.name}</span>
                        {isMe && (
                          <span className="text-[9px] font-mono font-black bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
                            YOU
                          </span>
                        )}
                        {p.isHost && (
                          <span className="text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Crown className="w-2.5 h-2.5" /> HOST
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-400 font-mono mt-0.5">
                        Balance: <span className="text-amber-300 font-bold">{formatRupee(p.chips)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Readiness Badge */}
                  <div>
                    {p.isReady ? (
                      <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-mono font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> READY
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-zinc-800/80 border border-zinc-700/60 text-zinc-400 rounded-xl text-xs font-mono font-bold">
                        WAITING
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* ── Fixed Bottom Action Bar (always visible & never scrolled away) ── */}
      <footer
        className="fixed bottom-0 inset-x-0 z-30 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 p-4 shadow-2xl"
        style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))' }}
      >
        <div className="max-w-2xl mx-auto flex flex-col gap-2.5">
          <div className="flex gap-2.5">
            {/* Ready Toggle */}
            <button
              onClick={() => onToggleReady(!isReady)}
              className={`flex-1 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition active:scale-95 flex items-center justify-center gap-2 ${
                isReady
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{isReady ? 'Unready' : "I'm Ready"}</span>
            </button>

            {/* Host Start Game */}
            {isHost && (
              <button
                onClick={onStartGame}
                disabled={!canStart}
                className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition active:scale-95 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-zinc-950" />
                <span>Start Game</span>
              </button>
            )}
          </div>

          <div className="text-center text-[11px] text-zinc-500 font-mono">
            {!canStart && isHost && playerCount < 2 && (
              <span>Waiting for at least 1 more friend to join…</span>
            )}
            {!isHost && <span>Waiting for host to start the table…</span>}
            {canStart && <span>All set! Host can deal the cards now.</span>}
          </div>
        </div>
      </footer>
    </div>
  );
};
