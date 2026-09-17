import React, { useState } from 'react';
import {
  BOT_PROFILES,
  type BotPersonality,
  type BotDifficulty,
  type RoomPublicState,
  formatRupee,
} from '@poker/shared';
import {
  X,
  Bot,
  Trash2,
  Zap,
  ShieldAlert,
  Flame,
  Calculator,
  Smile,
  Lock,
  Sparkles,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface AddBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomState: RoomPublicState;
  isHandInProgress?: boolean;
  onAddBot: (personality?: BotPersonality, name?: string, difficulty?: BotDifficulty) => void;
  onFillBots: (targetCount?: number, difficulty?: BotDifficulty | 'mixed') => void;
  onClearBots: () => void;
  onRemoveBot?: (botPlayerId: string) => void;
}

export const AddBotModal: React.FC<AddBotModalProps> = ({
  isOpen,
  onClose,
  roomState,
  isHandInProgress = false,
  onAddBot,
  onFillBots,
  onClearBots,
  onRemoveBot,
}) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<BotDifficulty | 'all'>('all');

  if (!isOpen) return null;

  const currentBots = roomState.players.filter((p) => p.isBot);
  const botCount = currentBots.length;
  const isFull = roomState.players.length >= roomState.config.maxPlayers;
  const existingNames = new Set(roomState.players.map((p) => p.name));
  const isNeededBotCount = roomState.players.length <= 2;

  const getBadgeStyle = (personality: BotPersonality) => {
    switch (personality) {
      case 'shark':
        return {
          bg: 'bg-rose-950/80 border-rose-500/40 text-rose-300',
          icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />,
          label: 'Shark • Tight-Aggressive',
        };
      case 'aggressive':
        return {
          bg: 'bg-amber-950/80 border-amber-500/40 text-amber-300',
          icon: <Flame className="w-3.5 h-3.5 text-amber-400" />,
          label: 'Wildcard • Aggressive',
        };
      case 'passive':
        return {
          bg: 'bg-blue-950/80 border-blue-500/40 text-blue-300',
          icon: <Smile className="w-3.5 h-3.5 text-blue-400" />,
          label: 'Calling Station • Passive',
        };
      case 'balanced':
      default:
        return {
          bg: 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300',
          icon: <Calculator className="w-3.5 h-3.5 text-emerald-400" />,
          label: 'GTO • Balanced',
        };
    }
  };

  const getDifficultyPill = (difficulty?: BotDifficulty) => {
    switch (difficulty) {
      case 'easy':
        return {
          bg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400',
          dot: 'bg-emerald-400',
          label: 'EASY',
        };
      case 'hard':
        return {
          bg: 'bg-rose-500/15 border-rose-500/40 text-rose-400',
          dot: 'bg-rose-400',
          label: 'HARD',
        };
      case 'medium':
      default:
        return {
          bg: 'bg-amber-500/15 border-amber-500/40 text-amber-400',
          dot: 'bg-amber-400',
          label: 'MEDIUM',
        };
    }
  };

  const filteredProfiles = BOT_PROFILES.filter((profile) => {
    if (selectedDifficulty === 'all') return true;
    return profile.difficulty === selectedDifficulty;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in pointer-events-auto">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-3xl bg-[#090d16] border border-zinc-800/90 rounded-3xl p-5 sm:p-6 shadow-2xl z-10 animate-scale-up text-zinc-100 max-h-[92dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-700 to-yellow-500 p-0.5 shadow-lg flex items-center justify-center">
              <div className="w-full h-full rounded-2xl bg-zinc-950 flex items-center justify-center text-amber-400">
                <Bot className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="font-black text-lg text-white flex items-center gap-2">
                <span>Table Bot AI & Levels</span>
                <span className="text-[11px] font-mono font-bold bg-amber-500/15 text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  {botCount} Bots Seated
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Practice, test strategies, or fill empty seats with multiple bots across Easy, Medium, & Hard tiers.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 transition active:scale-95"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Multi-Bot Batch Actions ── */}
        <div className="py-3 shrink-0 border-b border-zinc-800/60 flex flex-wrap items-center gap-2">
          <div className="text-[11px] font-mono font-bold text-zinc-400 mr-1 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Fill Table:</span>
          </div>

          <button
            onClick={() => !isFull && onFillBots(roomState.config.maxPlayers, 'mixed')}
            disabled={isFull}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-zinc-950 font-black text-xs rounded-xl shadow transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            title="Fill all empty seats with a realistic mix of players"
          >
            <Sparkles className="w-3.5 h-3.5 fill-zinc-950" />
            <span>Mixed Casino ({roomState.config.maxPlayers}-Max)</span>
          </button>

          <button
            onClick={() => !isFull && onFillBots(6, 'easy')}
            disabled={isFull}
            className="px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-500/40 text-emerald-300 font-bold text-xs rounded-xl transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Fill Easy</span>
          </button>

          <button
            onClick={() => !isFull && onFillBots(6, 'medium')}
            disabled={isFull}
            className="px-3 py-1.5 bg-amber-950/60 hover:bg-amber-900/70 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-xl transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Fill Medium</span>
          </button>

          <button
            onClick={() => !isFull && onFillBots(6, 'hard')}
            disabled={isFull}
            className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/70 border border-rose-500/40 text-rose-300 font-bold text-xs rounded-xl transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>Fill Hard</span>
          </button>

          <button
            onClick={() => !isFull && onAddBot(undefined, undefined, 'medium')}
            disabled={isFull}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold text-xs rounded-xl transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 ml-auto"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>+1 Bot</span>
          </button>
        </div>

        {/* ── Active Seated Bots Strip (With Needed-Bot Guard) ── */}
        {currentBots.length > 0 && (
          <div className="py-3 px-3.5 my-2 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 shrink-0">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-900 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-zinc-300 text-[11px] uppercase tracking-wider font-mono">
                  Currently Seated Bots ({currentBots.length})
                </span>
                {isNeededBotCount && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    <Lock className="w-2.5 h-2.5" />
                    <span>Bots needed for match (min 2 players)</span>
                  </span>
                )}
              </div>

              <button
                onClick={onClearBots}
                disabled={isNeededBotCount || isHandInProgress}
                className="text-[11px] font-mono text-rose-400 hover:text-rose-300 disabled:text-zinc-600 disabled:cursor-not-allowed flex items-center gap-1 transition"
                title={
                  isHandInProgress
                    ? 'Cannot clear bots during an active hand'
                    : isNeededBotCount
                    ? 'Cannot clear: Minimum 2 players needed to play'
                    : 'Remove all bots'
                }
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear All</span>
              </button>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pt-2.5 pb-1">
              {currentBots.map((bot) => {
                const diff = getDifficultyPill(bot.difficulty);
                const canRemove = !isNeededBotCount && !isHandInProgress && !!onRemoveBot;

                return (
                  <div
                    key={bot.id}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 shrink-0"
                  >
                    <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden flex-shrink-0">
                      <img
                        src={`https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(bot.avatar || bot.name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
                        alt={bot.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="leading-tight">
                      <div className="text-xs font-bold text-white max-w-[100px] truncate">
                        {bot.name}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${diff.dot}`} />
                        <span className="text-amber-300/80">{formatRupee(bot.chips)}</span>
                      </div>
                    </div>

                    {/* Bot Removal Guard: Locked if needed or in progress */}
                    {canRemove ? (
                      <button
                        onClick={() => onRemoveBot && onRemoveBot(bot.id)}
                        className="p-1 rounded-lg bg-zinc-800 hover:bg-rose-950/80 hover:text-rose-400 text-zinc-400 border border-zinc-700 hover:border-rose-500/40 transition active:scale-95 ml-1"
                        title="Remove Bot"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <div
                        className="p-1 text-zinc-600 cursor-not-allowed ml-1"
                        title={
                          isHandInProgress
                            ? 'Cannot remove bot during active hand'
                            : 'Bot needed to maintain minimum 2 players for poker'
                        }
                      >
                        <Lock className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Difficulty Tabs Filter ── */}
        <div className="pt-2 pb-3 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800/80 text-xs font-mono">
            <button
              onClick={() => setSelectedDifficulty('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                selectedDifficulty === 'all'
                  ? 'bg-amber-500 text-zinc-950 shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              All Tiers
            </button>
            <button
              onClick={() => setSelectedDifficulty('easy')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                selectedDifficulty === 'easy'
                  ? 'bg-emerald-500 text-zinc-950 shadow'
                  : 'text-zinc-400 hover:text-emerald-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Easy</span>
            </button>
            <button
              onClick={() => setSelectedDifficulty('medium')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                selectedDifficulty === 'medium'
                  ? 'bg-amber-500 text-zinc-950 shadow'
                  : 'text-zinc-400 hover:text-amber-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Medium</span>
            </button>
            <button
              onClick={() => setSelectedDifficulty('hard')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                selectedDifficulty === 'hard'
                  ? 'bg-rose-500 text-zinc-950 shadow'
                  : 'text-zinc-400 hover:text-rose-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>Hard</span>
            </button>
          </div>

          <div className="text-xs font-mono text-zinc-500 hidden sm:block">
            Showing {filteredProfiles.length} personalities
          </div>
        </div>

        {/* ── Bot Profiles Grid ── */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredProfiles.map((profile) => {
              const badge = getBadgeStyle(profile.personality);
              const diff = getDifficultyPill(profile.difficulty);
              const isSeated = existingNames.has(profile.name);

              return (
                <div
                  key={profile.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    isSeated
                      ? 'bg-zinc-900/30 border-zinc-800/60 opacity-60'
                      : 'bg-zinc-900/70 hover:bg-zinc-900 border-zinc-800/80 hover:border-zinc-700 shadow-md'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Bot Player Avatar */}
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-600/40 via-amber-700/40 to-yellow-500/40 p-0.5 shadow shrink-0 overflow-hidden">
                      <img
                        src={`https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(profile.avatar || profile.name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
                        alt={profile.name}
                        className="w-full h-full rounded-2xl object-cover bg-zinc-900"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-bold text-sm text-white truncate leading-tight">
                          {profile.name}
                        </div>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-black border uppercase tracking-wider ${diff.bg}`}
                        >
                          {diff.label}
                        </span>
                      </div>

                      {/* Personality badge */}
                      <div className="mt-1 flex items-center">
                        <span
                          className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold flex items-center gap-1 leading-none ${badge.bg}`}
                        >
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>
                      </div>

                      <p className="text-[11px] text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
                        {profile.bio}
                      </p>
                    </div>
                  </div>

                  {/* Seat Bot Action Button */}
                  <button
                    onClick={() => {
                      if (!isSeated && !isFull) {
                        onAddBot(profile.personality, profile.name, profile.difficulty);
                      }
                    }}
                    disabled={isSeated || isFull}
                    className={`w-full py-2 rounded-xl text-xs font-bold font-mono transition flex items-center justify-center gap-1.5 ${
                      isSeated
                        ? 'bg-zinc-800/40 text-zinc-500 cursor-not-allowed border border-zinc-800'
                        : isFull
                        ? 'bg-zinc-800/40 text-zinc-500 cursor-not-allowed border border-zinc-800'
                        : 'bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-zinc-200 border border-zinc-700 shadow active:scale-98'
                    }`}
                  >
                    <span>{isSeated ? 'Already Seated' : isFull ? 'Table Full' : '+ Seat This Bot'}</span>
                    {!isSeated && !isFull && <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500 shrink-0">
          <span className="font-mono">
            {roomState.players.length} / {roomState.config.maxPlayers} seats filled
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-zinc-950 font-bold text-xs rounded-xl shadow transition active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
