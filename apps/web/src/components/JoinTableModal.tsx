import React, { useState } from 'react';
import { X, Users, ArrowRight, QrCode, Link as LinkIcon, Hash } from 'lucide-react';

interface JoinTableModalProps {
  initialCode?: string;
  onClose: () => void;
  onJoin: (code: string, name: string) => void;
}

export const JoinTableModal: React.FC<JoinTableModalProps> = ({
  initialCode = '',
  onClose,
  onJoin,
}) => {
  const [tab, setTab] = useState<'code' | 'link'>('code');
  const [code, setCode] = useState(initialCode);
  const [name, setName] = useState(
    () => localStorage.getItem('poker_player_name') || ''
  );
  const [linkInput, setLinkInput] = useState('');
  const [showQR, setShowQR] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let targetCode = code.trim().toUpperCase();
    if (tab === 'link' && linkInput.trim()) {
      const match = linkInput.match(/\/room\/([A-Za-z0-9]+)/);
      if (match) targetCode = match[1].toUpperCase();
    }

    if (!targetCode) return;
    localStorage.setItem('poker_player_name', name.trim());
    onJoin(targetCode, name.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative my-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white transition p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
            ♠
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Join a Table</h2>
            <div className="text-[11px] text-zinc-400 font-mono">
              Enter the room code or share link
            </div>
          </div>
        </div>

        {/* Tabs: Room Code / Invite Link */}
        <div className="flex bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 my-4">
          <button
            type="button"
            onClick={() => setTab('code')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              tab === 'code'
                ? 'bg-amber-500 text-zinc-950 shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            Room Code
          </button>
          <button
            type="button"
            onClick={() => setTab('link')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              tab === 'link'
                ? 'bg-amber-500 text-zinc-950 shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            Invite Link
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nickname */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">
              Your Nickname
            </label>
            <input
              type="text"
              required
              maxLength={16}
              placeholder="e.g. Alex"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 text-white font-medium px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Room Code or Link Input */}
          {tab === 'code' ? (
            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">
                Enter 5-digit room code
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                maxLength={5}
                placeholder="e.g. 58291"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                className="w-full bg-zinc-900 border border-zinc-700 text-amber-300 font-mono font-bold text-center tracking-[0.25em] text-lg px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-amber-400"
              />
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">
                Paste Invite Link
              </label>
              <input
                type="url"
                required
                placeholder="https://.../room/K7Q9XM"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={!name.trim() || (tab === 'code' ? !code.trim() : !linkInput.trim())}
            className="w-full py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-1.5"
          >
            Join Table
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* QR Code trigger */}
        <div className="mt-4 pt-4 border-t border-zinc-800 text-center">
          <button
            type="button"
            onClick={() => setShowQR(!showQR)}
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-amber-300 text-xs font-medium transition"
          >
            <QrCode className="w-4 h-4 text-amber-400" />
            <span>Scan QR Code</span>
          </button>

          {showQR && (
            <div className="mt-3 p-4 bg-zinc-900 rounded-2xl border border-zinc-800 text-center">
              <div className="w-32 h-32 mx-auto bg-white rounded-xl p-2 flex items-center justify-center">
                <QrCode className="w-24 h-24 text-zinc-950" />
              </div>
              <p className="text-[10px] text-zinc-500 mt-2">
                Open camera on another phone to join via room link.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
