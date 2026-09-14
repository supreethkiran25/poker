import React, { useState } from 'react';
import { X, Volume2, Mic, Sparkles, MessageSquare, Shield, Check } from 'lucide-react';
import { soundManager } from '../audio/sound-manager.js';

interface TableSettingsModalProps {
  isVoiceActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onClose: () => void;
}

export const TableSettingsModal: React.FC<TableSettingsModalProps> = ({
  isVoiceActive,
  isMuted,
  onToggleMute,
  onClose,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(!soundManager.getMuted());
  const [animations, setAnimations] = useState(true);
  const [autoNextHand, setAutoNextHand] = useState(true);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (next && soundManager.getMuted()) soundManager.toggleMute();
    if (!next && !soundManager.getMuted()) soundManager.toggleMute();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-7 max-w-md w-full shadow-2xl relative my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
              ⚙️
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Table Settings</h2>
              <div className="text-[11px] text-zinc-400 font-mono">Preferences & Audio</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toggles */}
        <div className="py-4 space-y-3.5">
          {/* Sound */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800">
            <div className="flex items-center gap-3">
              <Volume2 className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-xs font-bold text-zinc-100">Sound Effects</div>
                <div className="text-[10px] text-zinc-500">Chips, card deals, turn alerts</div>
              </div>
            </div>
            <button
              onClick={toggleSound}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                soundEnabled ? 'bg-amber-500' : 'bg-zinc-800'
              }`}
            >
              <div
                className={`bg-zinc-950 w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  soundEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Voice / Mic */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800">
            <div className="flex items-center gap-3">
              <Mic className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-xs font-bold text-zinc-100">Voice Microphone</div>
                <div className="text-[10px] text-zinc-500">
                  {isVoiceActive ? (isMuted ? 'Muted' : 'Live transmitting') : 'Tap to connect'}
                </div>
              </div>
            </div>
            <button
              onClick={onToggleMute}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                isVoiceActive && !isMuted ? 'bg-emerald-500' : 'bg-zinc-800'
              }`}
            >
              <div
                className={`bg-zinc-950 w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  isVoiceActive && !isMuted ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Animations */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800">
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-xs font-bold text-zinc-100">Card Animations</div>
                <div className="text-[10px] text-zinc-500">Smooth dealing and chip flips</div>
              </div>
            </div>
            <button
              onClick={() => setAnimations(!animations)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                animations ? 'bg-amber-500' : 'bg-zinc-800'
              }`}
            >
              <div
                className={`bg-zinc-950 w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  animations ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Auto Next Hand */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800">
            <div className="flex items-center gap-3">
              <Check className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-xs font-bold text-zinc-100">Auto-start Next Hand</div>
                <div className="text-[10px] text-zinc-500">Continuous dealing between hands</div>
              </div>
            </div>
            <button
              onClick={() => setAutoNextHand(!autoNextHand)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                autoNextHand ? 'bg-amber-500' : 'bg-zinc-800'
              }`}
            >
              <div
                className={`bg-zinc-950 w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  autoNextHand ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-3 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition active:scale-95 shadow-lg"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
