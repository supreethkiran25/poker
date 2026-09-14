import React, { useState } from 'react';
import type { ChatMessage, ReactionItem } from '@poker/shared';
import { MessageSquare, Send, X, Smile } from 'lucide-react';

interface ChatAndReactionsProps {
  messages: ChatMessage[];
  reactions: ReactionItem[];
  onSendMessage: (msg: string) => void;
  onSendReaction: (rxn: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const EMOJI_REACTIONS = ['😂', '🔥', '😮', '👏', 'GG', '💀', '💸'];

export const ChatAndReactions: React.FC<ChatAndReactionsProps> = ({
  messages,
  reactions,
  onSendMessage,
  onSendReaction,
  isOpen,
  onClose,
}) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <>
      {/* ── Transient Floating Emoji Animations across table (non-blocking) ── */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {reactions.map((r) => (
          <div
            key={r.id}
            className="absolute floating-reaction text-3xl sm:text-4xl select-none"
            style={{
              left: '50%',
              top: '40%',
              marginLeft: `${(Math.sin(r.timestamp) * 100).toFixed(0)}px`,
            }}
          >
            {r.reaction}
          </div>
        ))}
      </div>

      {/* ── Slide-over Chat & Reactions Drawer ── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-end bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={onClose}
        >
          <div
            className="bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden w-full sm:w-80 sm:mr-4 sm:mb-4 h-[75vh] sm:h-[500px]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/60 flex-shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-zinc-100 tracking-wider uppercase">
                  Table Chat & Emojis
                </span>
              </div>
              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Reactions Bar - neatly located inside the drawer */}
            <div className="px-3 py-2 border-b border-zinc-800/80 bg-zinc-900/30 flex items-center justify-between gap-1 flex-shrink-0">
              <span className="text-[10px] text-zinc-500 font-mono uppercase flex items-center gap-1">
                <Smile className="w-3 h-3 text-amber-400" /> React:
              </span>
              <div className="flex items-center gap-1">
                {EMOJI_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onSendReaction(emoji);
                    }}
                    className="w-7 h-7 flex items-center justify-center text-sm hover:scale-125 transition-transform active:scale-95 bg-zinc-900/70 hover:bg-zinc-800 rounded-full"
                    title={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-3.5 overflow-y-auto flex flex-col gap-2 font-sans text-xs min-h-0">
              {messages.length === 0 ? (
                <div className="text-zinc-600 text-center my-auto italic">
                  No messages yet. Say hello or cheer your friends!
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-2.5 rounded-xl ${
                      m.isSystem
                        ? 'bg-zinc-900/50 text-amber-400/90 font-mono text-[10px] text-center border border-amber-500/10'
                        : 'bg-zinc-900/90 text-zinc-200 border border-zinc-800'
                    }`}
                  >
                    {!m.isSystem && (
                      <span className="font-bold text-amber-300 mr-1.5">{m.playerName}:</span>
                    )}
                    <span>{m.message}</span>
                  </div>
                ))
              )}
            </div>

            {/* Message Input Form */}
            <form
              onSubmit={handleSubmit}
              className="p-3 border-t border-zinc-800 flex gap-2 flex-shrink-0 bg-zinc-900/40"
            >
              <input
                type="text"
                placeholder="Type a message…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={150}
                className="flex-1 min-w-0 bg-zinc-900 border border-zinc-700 text-zinc-100 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="px-3.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-zinc-950 font-bold rounded-xl transition flex items-center justify-center flex-shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
