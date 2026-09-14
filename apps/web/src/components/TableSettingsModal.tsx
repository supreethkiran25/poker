import React, { useState } from 'react';
import { X, Volume2, Sparkles, MessageSquare, Clock, Users, Eye, Check } from 'lucide-react';
import { soundManager } from '../audio/sound-manager.js';

interface TableSettingsModalProps {
  isVoiceActive?: boolean;
  isMuted?: boolean;
  onToggleMute?: () => void;
  onClose: () => void;
}

export const TableSettingsModal: React.FC<TableSettingsModalProps> = ({
  isVoiceActive = false,
  isMuted = false,
  onToggleMute,
  onClose,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(!soundManager.getMuted());
  const [animations, setAnimations] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [turnTimer, setTurnTimer] = useState<number>(30);
  const [chatEnabled, setChatEnabled] = useState(true);
  const [reactionsEnabled, setReactionsEnabled] = useState(true);
  const [spectatorsEnabled, setSpectatorsEnabled] = useState(false);
  const [autoNextHand, setAutoNextHand] = useState(true);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (next && soundManager.getMuted()) soundManager.toggleMute();
    if (!next && !soundManager.getMuted()) soundManager.toggleMute();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative my-auto flex flex-col gap-5 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
              ⚙️
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Table Settings</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {/* Section 1: Table Settings */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 px-1">
              Table Settings
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
                <span className="text-xs font-bold text-zinc-200">Sound</span>
                <ToggleSwitch checked={soundEnabled} onChange={toggleSound} />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
                <span className="text-xs font-bold text-zinc-200">Animations</span>
                <ToggleSwitch checked={animations} onChange={() => setAnimations(!animations)} />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
                <span className="text-xs font-bold text-zinc-200">Reduced Motion</span>
                <ToggleSwitch
                  checked={reducedMotion}
                  onChange={() => setReducedMotion(!reducedMotion)}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Game Settings */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 px-1">
              Game Settings
            </h3>
            <div className="space-y-2.5">
              {/* Turn Timer Dropdown */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
                <span className="text-xs font-bold text-zinc-200">Turn Timer</span>
                <select
                  value={turnTimer}
                  onChange={(e) => setTurnTimer(Number(e.target.value))}
                  className="bg-zinc-950 border border-zinc-700 text-amber-300 font-mono text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value={15}>15 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={45}>45 seconds</option>
                  <option value={60}>60 seconds</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
                <span className="text-xs font-bold text-zinc-200">Chat</span>
                <ToggleSwitch checked={chatEnabled} onChange={() => setChatEnabled(!chatEnabled)} />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
                <span className="text-xs font-bold text-zinc-200">Reactions</span>
                <ToggleSwitch
                  checked={reactionsEnabled}
                  onChange={() => setReactionsEnabled(!reactionsEnabled)}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
                <span className="text-xs font-bold text-zinc-200">Spectators</span>
                <ToggleSwitch
                  checked={spectatorsEnabled}
                  onChange={() => setSpectatorsEnabled(!spectatorsEnabled)}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
                <span className="text-xs font-bold text-zinc-200">Auto-start Next Hand</span>
                <ToggleSwitch
                  checked={autoNextHand}
                  onChange={() => setAutoNextHand(!autoNextHand)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer: Solid Gold Save Changes Button matching Screen 9 */}
        <div className="pt-3 border-t border-zinc-800/80 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition active:scale-95 flex items-center justify-center"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
