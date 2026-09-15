import React, { useState } from 'react';
import {
  type RoomConfig,
  formatRupee,
  validateVirtualEconomyConfig,
  VIRTUAL_CURRENCY_DISCLAIMER,
} from '@poker/shared';
import {
  X,
  Shield,
  Clock,
  Users,
  Coins,
  AlertCircle,
  Play,
  Mic,
  MessageSquare,
  Sparkles,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Sliders,
} from 'lucide-react';

interface CreateRoomModalProps {
  initialName: string;
  onClose: () => void;
  onCreate: (name: string, config: RoomConfig, buyIn?: number) => void;
}

const STACK_PRESETS = [0, 1000, 5000, 10000, 25000, 50000, 100000];

const BLIND_PRESETS = [
  { sb: 5, bb: 10, label: 'Micro' },
  { sb: 25, bb: 50, label: 'Standard' },
  { sb: 50, bb: 100, label: 'Deep' },
  { sb: 100, bb: 200, label: 'High Roller' },
];

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  initialName,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState(initialName || 'Host');
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [startingChips, setStartingChips] = useState(10000);
  const [hostBuyIn, setHostBuyIn] = useState(10000);
  const [smallBlind, setSmallBlind] = useState(50);
  const [bigBlind, setBigBlind] = useState(100);
  const [turnTimerSeconds, setTurnTimerSeconds] = useState<15 | 30 | 45 | 60>(30);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [chatEnabled, setChatEnabled] = useState(true);
  const [reactionsEnabled, setReactionsEnabled] = useState(true);
  const [allowSpectators, setAllowSpectators] = useState(true);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleCreate = () => {
    if (!name.trim()) {
      setValidationError('Please enter your nickname');
      return;
    }

    const validation = validateVirtualEconomyConfig(startingChips, smallBlind, bigBlind);
    if (!validation.valid) {
      setValidationError(validation.error || 'Invalid chip configuration');
      return;
    }

    onCreate(
      name.trim(),
      {
        maxPlayers,
        startingChips,
        smallBlind,
        bigBlind,
        turnTimerSeconds,
        allowSpectators,
        chatEnabled,
        reactionsEnabled,
        voiceEnabled,
      },
      hostBuyIn >= 0 ? hostBuyIn : startingChips
    );
  };

  const handlePresetSelect = (chips: number) => {
    setStartingChips(chips);
    setHostBuyIn(chips);
    // Auto-adjust blinds if starting chips are small
    if (chips > 0 && chips < 1000) {
      setSmallBlind(5);
      setBigBlind(10);
    }
    setValidationError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-7 max-w-xl w-full shadow-2xl relative my-auto flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800/80 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
              ♠
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Create a Table
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Texas Hold'em
                </span>
              </h2>
              <div className="text-[11px] text-zinc-400 font-mono">
                Configure your table settings & buy-in
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition flex items-center gap-1 text-xs"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-[11px] font-medium hidden sm:inline">Back</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Responsible Gaming Disclaimer */}
        <div className="my-2.5 p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-[10px] sm:text-[11px] font-mono text-zinc-400 flex items-center gap-2 flex-shrink-0">
          <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">{VIRTUAL_CURRENCY_DISCLAIMER}</span>
        </div>

        {validationError && (
          <div className="mb-2.5 p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2 flex-shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 py-1">
          {/* Host Nickname */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
              Host Nickname
            </label>
            <input
              type="text"
              required
              maxLength={16}
              placeholder="e.g. Rahul"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setValidationError(null);
              }}
              className="w-full bg-zinc-900 border border-zinc-700 text-white font-medium px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-400 transition"
            />
          </div>

          {/* BUY-IN & STARTING STACK (0 to n) */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/50 border border-zinc-800/90 space-y-2.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wide text-zinc-200 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-400" />
                <span>Starting Stack & Buy-In</span>
              </label>
              <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-lg shadow-sm">
                {startingChips === 0 ? '₹0 (Free Play)' : formatRupee(startingChips)}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Each player's starting stack. Choose 0 for free play or any custom amount.
            </p>

            {/* Quick Presets */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
              {STACK_PRESETS.map((chips) => (
                <button
                  key={chips}
                  type="button"
                  onClick={() => handlePresetSelect(chips)}
                  className={`py-2 px-1 text-center rounded-xl font-mono text-xs font-bold border transition ${
                    startingChips === chips
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  {chips === 0 ? '₹0 Free' : chips >= 100000 ? '₹1L' : chips >= 1000 ? `₹${chips / 1000}k` : `₹${chips}`}
                </button>
              ))}
            </div>

            {/* Custom Numeric Input & Slider (0 to n) */}
            <div className="pt-1 flex items-center gap-2.5">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-xs">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  placeholder="Custom buy-in amount (0 to n)"
                  value={startingChips}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    const clamped = isNaN(val) || val < 0 ? 0 : val;
                    setStartingChips(clamped);
                    setHostBuyIn(clamped);
                    setValidationError(null);
                  }}
                  className="w-full bg-zinc-900 border border-zinc-700 text-white font-mono text-xs pl-7 pr-3 py-2 rounded-xl focus:outline-none focus:border-amber-400"
                />
              </div>
              <input
                type="range"
                min="0"
                max="100000"
                step="500"
                value={Math.min(startingChips, 100000)}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setStartingChips(val);
                  setHostBuyIn(val);
                }}
                className="w-28 sm:w-36 accent-amber-400 cursor-pointer"
                title="Drag to adjust stack"
              />
            </div>
          </div>

          {/* BLINDS & STAKES */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/50 border border-zinc-800/90 space-y-2.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wide text-zinc-200">
                Blind Stakes
              </label>
              <span className="text-xs font-mono font-bold text-amber-300">
                {formatRupee(smallBlind)} / {formatRupee(bigBlind)}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {BLIND_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setSmallBlind(preset.sb);
                    setBigBlind(preset.bb);
                    setValidationError(null);
                  }}
                  className={`p-2 sm:p-2.5 rounded-xl border text-left transition ${
                    smallBlind === preset.sb && bigBlind === preset.bb
                      ? 'bg-amber-500/15 border-amber-400 text-amber-300 shadow'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  <div className="text-[10px] text-zinc-500 uppercase font-mono">{preset.label}</div>
                  <div className="text-xs font-bold font-mono">
                    {formatRupee(preset.sb)} / {formatRupee(preset.bb)}
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Blinds */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-[10px] font-mono text-zinc-400 mb-0.5">
                  Small Blind (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  value={smallBlind}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val >= 1) {
                      setSmallBlind(val);
                      if (bigBlind <= val) setBigBlind(val * 2);
                    }
                  }}
                  className="w-full bg-zinc-900 border border-zinc-700 text-white font-mono text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-zinc-400 mb-0.5">
                  Big Blind (₹)
                </label>
                <input
                  type="number"
                  min={smallBlind + 1}
                  value={bigBlind}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) setBigBlind(val);
                  }}
                  className="w-full bg-zinc-900 border border-zinc-700 text-white font-mono text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* TABLE CAPACITY & TIMER */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Capacity */}
            <div className="p-3 rounded-2xl bg-zinc-900/50 border border-zinc-800/90 space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wide text-zinc-200 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  <span>Max Seats</span>
                </label>
                <span className="text-xs font-mono font-bold text-amber-300">
                  {maxPlayers} Players
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1">
                {[2, 4, 6, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setMaxPlayers(num)}
                    className={`py-1.5 rounded-lg font-mono text-xs font-bold border transition ${
                      maxPlayers === num
                        ? 'bg-amber-500 border-amber-400 text-zinc-950 shadow'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Timer */}
            <div className="p-3 rounded-2xl bg-zinc-900/50 border border-zinc-800/90 space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wide text-zinc-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Decision Timer</span>
                </label>
                <span className="text-xs font-mono font-bold text-amber-300">
                  {turnTimerSeconds}s
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {([15, 30, 45, 60] as const).map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setTurnTimerSeconds(sec)}
                    className={`py-1.5 rounded-lg font-mono text-xs font-bold border transition ${
                      turnTimerSeconds === sec
                        ? 'bg-amber-500 border-amber-400 text-zinc-950 shadow'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* TABLE FEATURES (Collapsible for clean look) */}
          <div className="border border-zinc-800/90 rounded-2xl bg-zinc-900/30 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold text-zinc-300 hover:text-white transition"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Table Features & Social Settings</span>
              </div>
              {showAdvancedOptions ? (
                <ChevronUp className="w-4 h-4 text-zinc-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-zinc-400" />
              )}
            </button>

            {showAdvancedOptions && (
              <div className="px-3.5 pb-3 space-y-2 pt-1 border-t border-zinc-800/50">
                <label className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/80 cursor-pointer hover:bg-zinc-900">
                  <div className="flex items-center gap-2">
                    <Mic className="w-3.5 h-3.5 text-emerald-400" />
                    <div>
                      <div className="text-xs font-semibold text-zinc-200">Voice Chat (Mic)</div>
                      <div className="text-[10px] text-zinc-500">Live crystal-clear table speech</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={voiceEnabled}
                    onChange={(e) => setVoiceEnabled(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/80 cursor-pointer hover:bg-zinc-900">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                    <div>
                      <div className="text-xs font-semibold text-zinc-200">Text Chat</div>
                      <div className="text-[10px] text-zinc-500">Slide-over table messaging</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={chatEnabled}
                    onChange={(e) => setChatEnabled(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/80 cursor-pointer hover:bg-zinc-900">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <div>
                      <div className="text-xs font-semibold text-zinc-200">Quick Reactions</div>
                      <div className="text-[10px] text-zinc-500">Emojis and cheer bursts</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={reactionsEnabled}
                    onChange={(e) => setReactionsEnabled(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/80 cursor-pointer hover:bg-zinc-900">
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-zinc-400" />
                    <div>
                      <div className="text-xs font-semibold text-zinc-200">Allow Spectators</div>
                      <div className="text-[10px] text-zinc-500">Non-seated users can watch</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowSpectators}
                    onChange={(e) => setAllowSpectators(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 cursor-pointer"
                  />
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Action Footer */}
        <div className="pt-3.5 border-t border-zinc-800 flex items-center justify-between gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl border border-zinc-700 transition flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>

          <button
            type="button"
            onClick={handleCreate}
            className="flex-1 max-w-xs py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-xl transition active:scale-95 flex items-center justify-center gap-2"
          >
            <Play className="w-3.5 h-3.5 fill-zinc-950" />
            <span>
              {startingChips === 0
                ? 'Create Table (Free Play)'
                : `Create Table • ${formatRupee(startingChips)}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
