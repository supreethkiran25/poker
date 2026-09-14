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
  Check,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';

interface CreateRoomModalProps {
  initialName: string;
  onClose: () => void;
  onCreate: (name: string, config: RoomConfig) => void;
}

const STACK_PRESETS = [1000, 5000, 10000, 25000, 50000, 100000];

const BLIND_PRESETS = [
  { sb: 5, bb: 10, label: 'Micro' },
  { sb: 25, bb: 50, label: 'Standard' },
  { sb: 50, bb: 100, label: 'Deep Stack' },
  { sb: 100, bb: 200, label: 'High Roller' },
];

const STEPS = [
  { id: 1, label: 'Game', sub: 'Texas Hold\'em' },
  { id: 2, label: 'Players', sub: 'Seat Capacity' },
  { id: 3, label: 'Starting Stack', sub: 'Virtual Chips' },
  { id: 4, label: 'Blinds', sub: 'Small / Big' },
  { id: 5, label: 'Timer', sub: 'Turn Duration' },
  { id: 6, label: 'Table Options', sub: 'Voice, Chat' },
];

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  initialName,
  onClose,
  onCreate,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [name, setName] = useState(initialName || 'Host');
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [startingChips, setStartingChips] = useState(10000);
  const [smallBlind, setSmallBlind] = useState(50);
  const [bigBlind, setBigBlind] = useState(100);
  const [turnTimerSeconds, setTurnTimerSeconds] = useState<15 | 30 | 45 | 60>(30);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [chatEnabled, setChatEnabled] = useState(true);
  const [reactionsEnabled, setReactionsEnabled] = useState(true);
  const [allowSpectators, setAllowSpectators] = useState(true);
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

    onCreate(name.trim(), {
      maxPlayers,
      startingChips,
      smallBlind,
      bigBlind,
      turnTimerSeconds,
      allowSpectators,
      chatEnabled,
      reactionsEnabled,
      voiceEnabled,
    });
  };

  const nextStep = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
      setValidationError(null);
    } else {
      handleCreate();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setValidationError(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-7 max-w-2xl w-full shadow-2xl relative my-auto flex flex-col max-h-[90vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
              ♠
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Create a Table
              </h2>
              <div className="text-[11px] text-zinc-400 font-mono">
                Configure your game settings (Step {currentStep} of 6)
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Responsible Gaming Disclaimer */}
        <div className="my-3 p-2 rounded-xl bg-zinc-900/60 border border-zinc-800 text-[10px] sm:text-[11px] font-mono text-zinc-400 flex items-center gap-2 flex-shrink-0">
          <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">{VIRTUAL_CURRENCY_DISCLAIMER}</span>
        </div>

        {validationError && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2 flex-shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Wizard Main Container: Step indicator + Step Content */}
        <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-y-auto py-2 min-h-0">
          {/* Step indicator (sidebar on md, horizontal on mobile) */}
          <div className="flex md:flex-col gap-1.5 overflow-x-auto pb-1 md:pb-0 md:w-48 flex-shrink-0">
            {STEPS.map((s) => (
              <button
                key={s.id}
                onClick={() => setCurrentStep(s.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition whitespace-nowrap md:whitespace-normal ${
                  currentStep === s.id
                    ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300'
                    : currentStep > s.id
                    ? 'text-zinc-300 hover:bg-zinc-900'
                    : 'text-zinc-600 hover:bg-zinc-900'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-bold shrink-0 ${
                    currentStep === s.id
                      ? 'bg-amber-500 text-zinc-950'
                      : currentStep > s.id
                      ? 'bg-zinc-700 text-zinc-300'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {currentStep > s.id ? '✓' : s.id}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold leading-tight truncate">{s.label}</div>
                  <div className="text-[10px] text-zinc-500 hidden md:block truncate">{s.sub}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Active Step Panel */}
          <div className="flex-1 flex flex-col justify-between min-h-[220px]">
            {/* Step 1: Game Choice & Host Nickname */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-300 mb-1">
                    Your Nickname
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    placeholder="e.g. Rahul"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 text-white font-medium px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-300 mb-2">
                    Select Game Variant
                  </label>
                  <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/60 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-amber-500/40 flex items-center justify-center text-lg font-black text-amber-400">
                        ♠♥
                      </div>
                      <div>
                        <div className="text-sm font-black text-white">Texas Hold'em</div>
                        <div className="text-xs text-zinc-400">The classic no-limit poker game</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-amber-500 text-zinc-950 px-2 py-0.5 rounded-full uppercase">
                      Selected
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Players */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold uppercase text-zinc-300">
                      Table Capacity
                    </label>
                    <span className="text-base font-bold font-mono text-amber-300">
                      {maxPlayers} Players
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-3">
                    Choose maximum seats allowed at your private table (2 to 10).
                  </p>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {[2, 4, 6, 8, 9, 10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setMaxPlayers(num)}
                        className={`py-2.5 rounded-xl font-mono text-sm font-bold border transition ${
                          maxPlayers === num
                            ? 'bg-amber-500 border-amber-400 text-zinc-950 shadow-lg'
                            : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        {num} Max
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Starting Stack */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold uppercase text-zinc-300">
                      Starting Virtual Stack
                    </label>
                    <span className="text-base font-bold font-mono text-amber-300">
                      {formatRupee(startingChips)}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-3">
                    Each seated player begins with this amount of virtual chips.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {STACK_PRESETS.map((chips) => (
                      <button
                        key={chips}
                        type="button"
                        onClick={() => setStartingChips(chips)}
                        className={`p-3 rounded-xl border text-left transition ${
                          startingChips === chips
                            ? 'bg-amber-500/15 border-amber-400 text-amber-300 shadow'
                            : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        <div className="text-[10px] text-zinc-500 uppercase font-mono">Stack</div>
                        <div className="text-sm font-bold font-mono">{formatRupee(chips)}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Blinds */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold uppercase text-zinc-300">
                      Blind Stakes
                    </label>
                    <span className="text-base font-bold font-mono text-amber-300">
                      {formatRupee(smallBlind)} / {formatRupee(bigBlind)}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-3">
                    Select the initial small blind and big blind levels.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {BLIND_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setSmallBlind(preset.sb);
                          setBigBlind(preset.bb);
                        }}
                        className={`p-3 rounded-xl border text-left transition ${
                          smallBlind === preset.sb && bigBlind === preset.bb
                            ? 'bg-amber-500/15 border-amber-400 text-amber-300 shadow'
                            : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        <div className="text-[10px] text-zinc-500 uppercase font-mono">
                          {preset.label}
                        </div>
                        <div className="text-sm font-bold font-mono">
                          {formatRupee(preset.sb)} / {formatRupee(preset.bb)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Turn Timer */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold uppercase text-zinc-300">
                      Action Turn Timer
                    </label>
                    <span className="text-base font-bold font-mono text-amber-300">
                      {turnTimerSeconds} Seconds
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-3">
                    Time allocated per player decision before automatic fold/check.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {([15, 30, 45, 60] as const).map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setTurnTimerSeconds(sec)}
                        className={`py-3 rounded-xl border font-mono text-sm font-bold transition flex flex-col items-center justify-center gap-1 ${
                          turnTimerSeconds === sec
                            ? 'bg-amber-500 border-amber-400 text-zinc-950 shadow-lg'
                            : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        <Clock className="w-4 h-4" />
                        <span>{sec}s</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Table Options */}
            {currentStep === 6 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="flex items-center gap-2.5">
                    <Mic className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-xs font-bold text-zinc-100">Live Voice Chat (Mic)</div>
                      <div className="text-[10px] text-zinc-500">Players can speak & hear each other</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={voiceEnabled}
                    onChange={(e) => setVoiceEnabled(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="flex items-center gap-2.5">
                    <MessageSquare className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="text-xs font-bold text-zinc-100">Table Chat</div>
                      <div className="text-[10px] text-zinc-500">In-game text messaging</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={chatEnabled}
                    onChange={(e) => setChatEnabled(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="text-xs font-bold text-zinc-100">Quick Reactions</div>
                      <div className="text-[10px] text-zinc-500">Emojis and cheer reactions</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={reactionsEnabled}
                    onChange={(e) => setReactionsEnabled(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Wizard Footer Navigation */}
        <div className="pt-4 border-t border-zinc-800 flex items-center justify-between flex-shrink-0">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl border border-zinc-700 transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={nextStep}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition active:scale-95 flex items-center gap-1.5"
          >
            <span>{currentStep === 6 ? 'Create Table' : 'Next'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
