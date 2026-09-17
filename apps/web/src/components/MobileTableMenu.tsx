import {
  X,
  Share2,
  Check,
  Coins,
  History,
  BookOpen,
  Settings,
  LogOut,
  Bot,
} from 'lucide-react';
import { formatRupee } from '@poker/shared';

interface MobileTableMenuProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  handNumber: number;
  smallBlind: number;
  bigBlind: number;
  copiedCode: boolean;
  onShareInvite: () => void;
  onOpenRebuy: () => void;
  onOpenHistory: () => void;
  onOpenRules: () => void;
  onOpenSettings: () => void;
  onLeaveRoom: () => void;
  onOpenAddBot?: () => void;
}

export const MobileTableMenu: React.FC<MobileTableMenuProps> = ({
  isOpen,
  onClose,
  roomCode,
  handNumber,
  smallBlind,
  bigBlind,
  copiedCode,
  onShareInvite,
  onOpenRebuy,
  onOpenHistory,
  onOpenRules,
  onOpenSettings,
  onLeaveRoom,
  onOpenAddBot,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm animate-fade-in pointer-events-auto">
      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Bottom Sheet Modal */}
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#0f172a] to-[#090d16] border-t border-zinc-700/80 rounded-t-3xl p-5 shadow-2xl z-10 animate-slide-up text-zinc-100 max-h-[85dvh] overflow-y-auto">
        {/* Drag handle */}
        <div className="w-12 h-1.5 bg-zinc-600 rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold text-sm">♠ Table {roomCode}</span>
              <span className="text-zinc-500 text-xs">•</span>
              <span className="text-zinc-400 text-xs font-mono">Hand #{handNumber}</span>
            </div>
            <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
              Blinds: {formatRupee(smallBlind)} / {formatRupee(bigBlind)}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 transition active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Invite Code Quick Card */}
        <div className="my-4 p-3 bg-zinc-900/90 rounded-2xl border border-amber-500/30 flex items-center justify-between gap-2 shadow-inner">
          <div className="min-w-0">
            <div className="text-[10px] text-amber-400/90 uppercase tracking-wider font-bold">
              Room Invite Code
            </div>
            <div className="text-base font-black font-mono tracking-widest text-white truncate">
              {roomCode}
            </div>
          </div>
          <button
            onClick={onShareInvite}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 active:scale-95 text-zinc-950 font-black text-xs rounded-xl shadow flex items-center gap-1.5 shrink-0 transition"
          >
            {copiedCode ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-950" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-zinc-950" />
                <span>Share</span>
              </>
            )}
          </button>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-2 gap-2.5 my-3">
          {/* Rebuy Chips */}
          <button
            onClick={() => {
              onClose();
              onOpenRebuy();
            }}
            className="p-3 bg-zinc-900/90 hover:bg-zinc-800/90 active:scale-98 rounded-2xl border border-zinc-800 flex items-center gap-3 transition text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Rebuy Chips</div>
              <div className="text-[10px] text-zinc-400">Add to stack</div>
            </div>
          </button>

          {/* Hand History */}
          <button
            onClick={() => {
              onClose();
              onOpenHistory();
            }}
            className="p-3 bg-zinc-900/90 hover:bg-zinc-800/90 active:scale-98 rounded-2xl border border-zinc-800 flex items-center gap-3 transition text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Hand History</div>
              <div className="text-[10px] text-zinc-400">Past rounds</div>
            </div>
          </button>

          {/* Game Rules */}
          <button
            onClick={() => {
              onClose();
              onOpenRules();
            }}
            className="p-3 bg-zinc-900/90 hover:bg-zinc-800/90 active:scale-98 rounded-2xl border border-zinc-800 flex items-center gap-3 transition text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Poker Rules</div>
              <div className="text-[10px] text-zinc-400">Hand ranks</div>
            </div>
          </button>

          {/* Table Settings */}
          <button
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="p-3 bg-zinc-900/90 hover:bg-zinc-800/90 active:scale-98 rounded-2xl border border-zinc-800 flex items-center gap-3 transition text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Settings</div>
              <div className="text-[10px] text-zinc-400">Audio & timer</div>
            </div>
          </button>

          {/* Add Bots */}
          {onOpenAddBot && (
            <button
              onClick={() => {
                onClose();
                onOpenAddBot();
              }}
              className="p-3 bg-zinc-900/90 hover:bg-zinc-800/90 active:scale-98 rounded-2xl border border-purple-500/40 flex items-center gap-3 transition text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Add Bots</span>
                  <span className="text-[9px] font-mono bg-purple-500/20 text-purple-300 px-1 rounded">AI</span>
                </div>
                <div className="text-[10px] text-zinc-400">Play instantly</div>
              </div>
            </button>
          )}
        </div>

        {/* Leave Table Button */}
        <button
          onClick={() => {
            onClose();
            onLeaveRoom();
          }}
          className="w-full mt-2 py-3 px-4 bg-red-950/40 hover:bg-red-900/50 border border-red-500/40 rounded-2xl text-red-300 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-98"
        >
          <LogOut className="w-4 h-4" />
          <span>Leave Table & Return to Lobby</span>
        </button>
      </div>
    </div>
  );
};
