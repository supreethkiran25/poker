import React, { useState } from 'react';
import {
  type RoomConfig,
  formatRupee,
  validateVirtualEconomyConfig,
  VIRTUAL_CURRENCY_DISCLAIMER,
} from '@poker/shared';
import { X, Shield, Clock, Users, Coins, AlertCircle, Play } from 'lucide-react';

interface CreateRoomModalProps {
  initialName: string;
  onClose: () => void;
  onCreate: (name: string, config: RoomConfig) => void;
}

const STACK_PRESETS = [1000, 5000, 10000, 25000, 50000, 100000];

const BLIND_PRESETS = [
  { sb: 5, bb: 10 },
  { sb: 10, bb: 20 },
  { sb: 25, bb: 50 },
  { sb: 50, bb: 100 },
  { sb: 100, bb: 200 },
  { sb: 250, bb: 500 },
];

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  initialName,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState(initialName || 'Host');
  const [startingChips, setStartingChips] = useState(10000);
  const [isCustomStack, setIsCustomStack] = useState(false);

  const [smallBlind, setSmallBlind] = useState(50);
  const [bigBlind, setBigBlind] = useState(100);
  const [isCustomBlinds, setIsCustomBlinds] = useState(false);

  const [turnTimerSeconds, setTurnTimerSeconds] = useState<15 | 30 | 45 | 60>(30);
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSelectStackPreset = (val: number) => {
    setIsCustomStack(false);
    setStartingChips(val);
    setValidationError(null);
  };

  const handleSelectBlindPreset = (sb: number, bb: number) => {
    setIsCustomBlinds(false);
    setSmallBlind(sb);
    setBigBlind(bb);
    setValidationError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const validation = validateVirtualEconomyConfig(startingChips, smallBlind, bigBlind);
    if (!validation.valid) {
      setValidationError(validation.error || 'Invalid configuration');
      return;
    }

    onCreate(name.trim(), {
      maxPlayers,
      startingChips,
      smallBlind,
      bigBlind,
      turnTimerSeconds,
      allowSpectators: true,
      chatEnabled: true,
      reactionsEnabled: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative my-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white transition p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
            ♠
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Table Settings
            </h2>
            <div className="text-[11px] text-zinc-400 font-mono">
              Texas Hold'em No-Limit
            </div>
          </div>
        </div>

        {/* Responsible Virtual Currency Disclaimer */}
        <div className="my-4 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400 flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{VIRTUAL_CURRENCY_DISCLAIMER}</span>
        </div>

        {validationError && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Host Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1">
              Host Name
            </label>
            <input
              type="text"
              required
              maxLength={18}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex"
              className="w-full bg-zinc-900 border border-zinc-700 text-white px-3.5 py-2 rounded-xl font-medium focus:outline-none focus:border-amber-400 text-sm"
            />
          </div>

          {/* Starting Stack Presets & Custom */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-300">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                Starting Stack
              </label>
              <span className="text-xs font-mono font-bold text-amber-400">
                {formatRupee(startingChips)}
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mb-2">
              {STACK_PRESETS.map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => handleSelectStackPreset(val)}
                  className={`py-1.5 text-[11px] font-mono font-bold rounded-lg border transition ${
                    !isCustomStack && startingChips === val
                      ? 'bg-amber-500 text-zinc-950 border-amber-400'
                      : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {formatRupee(val)}
                </button>
              ))}
            </div>

            {/* Custom Stack Toggle / Input */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCustomStack(!isCustomStack)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-md border transition ${
                  isCustomStack
                    ? 'bg-amber-500 text-zinc-950 border-amber-400'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                }`}
              >
                Custom
              </button>
              {isCustomStack && (
                <div className="flex-1 flex items-center bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1">
                  <span className="text-amber-400 font-bold mr-1 text-xs">₹</span>
                  <input
                    type="number"
                    min={500}
                    max={10000000}
                    step={100}
                    value={startingChips}
                    onChange={(e) => setStartingChips(Math.round(Number(e.target.value)))}
                    className="w-full bg-transparent text-amber-300 font-mono text-xs focus:outline-none"
                    placeholder="e.g. 37500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Virtual Blinds Presets & Custom */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Blinds (SB / BB)
              </label>
              <span className="text-xs font-mono font-bold text-amber-400">
                {formatRupee(smallBlind)} / {formatRupee(bigBlind)}
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mb-2">
              {BLIND_PRESETS.map(({ sb, bb }) => (
                <button
                  type="button"
                  key={`${sb}-${bb}`}
                  onClick={() => handleSelectBlindPreset(sb, bb)}
                  className={`py-1.5 text-[11px] font-mono font-bold rounded-lg border transition ${
                    !isCustomBlinds && smallBlind === sb && bigBlind === bb
                      ? 'bg-amber-500 text-zinc-950 border-amber-400'
                      : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  ₹{sb}/₹{bb}
                </button>
              ))}
            </div>

            {/* Custom Blinds Toggle */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCustomBlinds(!isCustomBlinds)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-md border transition ${
                  isCustomBlinds
                    ? 'bg-amber-500 text-zinc-950 border-amber-400'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                }`}
              >
                Custom
              </button>
              {isCustomBlinds && (
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 flex items-center bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1">
                    <span className="text-zinc-500 text-[10px] mr-1">SB:</span>
                    <input
                      type="number"
                      min={1}
                      value={smallBlind}
                      onChange={(e) => setSmallBlind(Math.round(Number(e.target.value)))}
                      className="w-full bg-transparent text-amber-300 font-mono text-xs focus:outline-none"
                    />
                  </div>
                  <div className="flex-1 flex items-center bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1">
                    <span className="text-zinc-500 text-[10px] mr-1">BB:</span>
                    <input
                      type="number"
                      min={2}
                      value={bigBlind}
                      onChange={(e) => setBigBlind(Math.round(Number(e.target.value)))}
                      className="w-full bg-transparent text-amber-300 font-mono text-xs focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Turn Timer & Max Players */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Action Clock
              </label>
              <select
                value={turnTimerSeconds}
                onChange={(e) => setTurnTimerSeconds(Number(e.target.value) as any)}
                className="w-full bg-zinc-900 border border-zinc-700 text-white px-3 py-2 rounded-xl font-medium focus:outline-none focus:border-amber-400 text-xs"
              >
                <option value={15}>15s (Turbo)</option>
                <option value={30}>30s (Standard)</option>
                <option value={45}>45s (Deep)</option>
                <option value={60}>60s (Relaxed)</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                Table Size
              </label>
              <select
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-700 text-white px-3 py-2 rounded-xl font-medium focus:outline-none focus:border-amber-400 text-xs"
              >
                <option value={2}>2-Max (Heads-Up)</option>
                <option value={4}>4-Max</option>
                <option value={6}>6-Max (Short Handed)</option>
                <option value={8}>8-Max (Standard)</option>
                <option value={10}>10-Max (Full Ring)</option>
              </select>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3.5 mt-2 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 text-zinc-950 font-black rounded-xl shadow-xl transition active:scale-[0.98] uppercase tracking-wider text-xs flex items-center justify-center gap-2"
          >
            <Play className="w-3.5 h-3.5 fill-zinc-950" />
            Create Table
          </button>
        </form>
      </div>
    </div>
  );
};
