import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowLeft,
  Volume2,
  VolumeX,
  Sparkles,
  MessageSquare,
  Clock,
  History,
  BookOpen,
  Check,
  Shield,
  Layers,
  Palette,
  Eye,
} from 'lucide-react';
import { soundManager } from '../audio/sound-manager.js';
import type { RoomConfig } from '@poker/shared';

interface TableSettingsModalProps {
  roomCode?: string;
  isHost?: boolean;
  currentTurnTimer?: number;
  isVoiceActive?: boolean;
  isMuted?: boolean;
  onToggleMute?: () => void;
  onUpdateConfig?: (config: Partial<RoomConfig>) => void;
  onOpenHistory?: () => void;
  onOpenRules?: () => void;
  onClose: () => void;
}

export const TableSettingsModal: React.FC<TableSettingsModalProps> = ({
  roomCode,
  isHost = false,
  currentTurnTimer = 30,
  isVoiceActive = false,
  isMuted = false,
  onToggleMute,
  onUpdateConfig,
  onOpenHistory,
  onOpenRules,
  onClose,
}) => {
  // Load persisted preferences or sensible defaults
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('poker_sound_enabled') !== 'false';
  });

  const [animations, setAnimations] = useState<boolean>(() => {
    return localStorage.getItem('poker_animations_enabled') !== 'false';
  });

  const [showFoldedCards, setShowFoldedCards] = useState<boolean>(() => {
    return localStorage.getItem('poker_show_folded_cards') !== 'false';
  });

  const [fourColorDeck, setFourColorDeck] = useState<boolean>(() => {
    return localStorage.getItem('poker_four_color_deck') === 'true';
  });

  const [chatEnabled, setChatEnabled] = useState<boolean>(() => {
    return localStorage.getItem('poker_chat_enabled') !== 'false';
  });

  const [reactionsEnabled, setReactionsEnabled] = useState<boolean>(() => {
    return localStorage.getItem('poker_reactions_enabled') !== 'false';
  });

  const [turnTimer, setTurnTimer] = useState<15 | 30 | 45 | 60>(() => {
    const val = currentTurnTimer as 15 | 30 | 45 | 60;
    return [15, 30, 45, 60].includes(val) ? val : 30;
  });
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Sync turn timer prop if updated
  useEffect(() => {
    if (currentTurnTimer && [15, 30, 45, 60].includes(currentTurnTimer as any)) {
      setTurnTimer(currentTurnTimer as 15 | 30 | 45 | 60);
    }
  }, [currentTurnTimer]);

  const handleSave = () => {
    // 1. Persist local preferences
    localStorage.setItem('poker_sound_enabled', String(soundEnabled));
    localStorage.setItem('poker_animations_enabled', String(animations));
    localStorage.setItem('poker_show_folded_cards', String(showFoldedCards));
    localStorage.setItem('poker_four_color_deck', String(fourColorDeck));
    localStorage.setItem('poker_chat_enabled', String(chatEnabled));
    localStorage.setItem('poker_reactions_enabled', String(reactionsEnabled));

    // 2. Apply Sound
    soundManager.setMuted(!soundEnabled);

    // 3. If Host, emit updated game turn timer to server
    if (isHost && onUpdateConfig) {
      onUpdateConfig({
        turnTimerSeconds: turnTimer,
        chatEnabled,
        reactionsEnabled,
      });
    }

    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 500);
  };

  const ToggleSwitch = ({
    checked,
    onChange,
  }: {
    checked: boolean;
    onChange: () => void;
  }) => (
    <button
      type="button"
      onClick={onChange}
      className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
        checked ? 'bg-emerald-500' : 'bg-zinc-800'
      }`}
    >
      <div
        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 flex items-center justify-center text-[9px] font-bold ${
          checked ? 'translate-x-6 text-emerald-600' : 'translate-x-0 text-zinc-500'
        }`}
      >
        {checked ? 'On' : 'Off'}
      </div>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-7 max-w-md w-full shadow-2xl relative my-auto flex flex-col gap-4 max-h-[92vh]">
        {/* Top Header with prominent Back button & Close button */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-bold text-zinc-300 hover:text-white transition active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-1.5 text-center">
            <span className="text-base font-black text-white tracking-tight">Table Settings</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert Banner */}
        {savedSuccess && (
          <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/50 rounded-2xl text-emerald-300 text-xs font-mono font-bold flex items-center justify-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Settings saved and applied!</span>
          </div>
        )}

        {/* Settings Body */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1 text-xs">
          {/* Section 1: Audio & Voice Settings */}
          <div>
            <h3 className="font-mono text-[10px] uppercase font-bold text-amber-400/90 tracking-wider mb-2.5 px-1">
              Audio & Effects
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
                <div className="flex items-center gap-2.5">
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-zinc-500" />
                  )}
                  <div>
                    <div className="font-bold text-zinc-200">Game Sound Effects</div>
                    <div className="text-[10px] text-zinc-500 font-mono">Chips, cards, and win audio</div>
                  </div>
                </div>
                <ToggleSwitch
                  checked={soundEnabled}
                  onChange={() => setSoundEnabled(!soundEnabled)}
                />
              </div>

              {onToggleMute && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
                  <div>
                    <div className="font-bold text-zinc-200">Microphone (Voice Chat)</div>
                    <div className="text-[10px] text-zinc-500 font-mono">
                      {isVoiceActive && !isMuted ? 'Mic is live & transmitting' : 'Mic is muted'}
                    </div>
                  </div>
                  <button
                    onClick={onToggleMute}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition ${
                      isVoiceActive && !isMuted
                        ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {isVoiceActive && !isMuted ? 'Mute' : 'Unmute'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Table & Card Preferences */}
          <div>
            <h3 className="font-mono text-[10px] uppercase font-bold text-amber-400/90 tracking-wider mb-2.5 px-1">
              Table & Cards
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
                <div className="flex items-center gap-2.5">
                  <Eye className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="font-bold text-zinc-200">Keep Folded Cards Visible</div>
                    <div className="text-[10px] text-zinc-500 font-mono">
                      See your cards dimmed after folding
                    </div>
                  </div>
                </div>
                <ToggleSwitch
                  checked={showFoldedCards}
                  onChange={() => setShowFoldedCards(!showFoldedCards)}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="font-bold text-zinc-200">Animations & Transitions</div>
                    <div className="text-[10px] text-zinc-500 font-mono">
                      Smooth dealing and chip effects
                    </div>
                  </div>
                </div>
                <ToggleSwitch
                  checked={animations}
                  onChange={() => setAnimations(!animations)}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Room Game Rules (Host Controls) */}
          <div>
            <div className="flex items-center justify-between mb-2.5 px-1">
              <h3 className="font-mono text-[10px] uppercase font-bold text-amber-400/90 tracking-wider">
                Game Rules {isHost ? '(Host Controls)' : ''}
              </h3>
              {!isHost && (
                <span className="text-[9px] font-mono text-zinc-500">Host manages rule limits</span>
              )}
            </div>

            <div className="space-y-2">
              {/* Turn Timer */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="font-bold text-zinc-200">Player Decision Timer</div>
                    <div className="text-[10px] text-zinc-500 font-mono">Seconds allowed per turn</div>
                  </div>
                </div>

                {isHost ? (
                  <select
                    value={turnTimer}
                    onChange={(e) => setTurnTimer(Number(e.target.value) as 15 | 30 | 45 | 60)}
                    className="bg-zinc-950 border border-amber-500/50 text-amber-300 font-mono text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value={15}>15s (Turbo)</option>
                    <option value={30}>30s (Standard)</option>
                    <option value={45}>45s (Relaxed)</option>
                    <option value={60}>60s (Slow)</option>
                  </select>
                ) : (
                  <span className="font-mono font-bold text-amber-300 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800">
                    {turnTimer}s
                  </span>
                )}
              </div>

              {/* Chat & Reactions Toggles */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="font-bold text-zinc-200">Table Chat & Emojis</div>
                    <div className="text-[10px] text-zinc-500 font-mono">In-game chat notifications</div>
                  </div>
                </div>
                <ToggleSwitch
                  checked={chatEnabled}
                  onChange={() => setChatEnabled(!chatEnabled)}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Quick Table Shortcuts (Especially handy on mobile!) */}
          <div>
            <h3 className="font-mono text-[10px] uppercase font-bold text-amber-400/90 tracking-wider mb-2.5 px-1">
              Table Guides & History
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {onOpenHistory && (
                <button
                  type="button"
                  onClick={onOpenHistory}
                  className="p-3 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 flex items-center gap-2 text-left transition group"
                >
                  <History className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
                  <div>
                    <div className="font-bold text-zinc-200 text-xs">Match History</div>
                    <div className="text-[9px] text-zinc-500 font-mono">Past hands</div>
                  </div>
                </button>
              )}

              {onOpenRules && (
                <button
                  type="button"
                  onClick={onOpenRules}
                  className="p-3 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 flex items-center gap-2 text-left transition group"
                >
                  <BookOpen className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
                  <div>
                    <div className="font-bold text-zinc-200 text-xs">Poker Rules</div>
                    <div className="text-[9px] text-zinc-500 font-mono">Hand rankings</div>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer: Save Changes Button + Back to Table */}
        <div className="pt-2 border-t border-zinc-800/80 flex flex-col gap-2 flex-shrink-0">
          <button
            onClick={handleSave}
            className="w-full py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Save & Apply Settings</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-mono font-bold rounded-xl transition flex items-center justify-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Table</span>
          </button>
        </div>
      </div>
    </div>
  );
};
