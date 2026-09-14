import React, { useState } from 'react';
import type { ChatMessage, ReactionItem } from '@poker/shared';
import { MessageSquare, Send, X } from 'lucide-react';

interface ChatAndReactionsProps {
  messages: ChatMessage[];
  reactions: ReactionItem[];
  onSendMessage: (msg: string) => void;
  onSendReaction: (rxn: string) => void;
}

const EMOJI_REACTIONS = ['😂', '🔥', '😮', '👏', 'GG', '💀', '💸'];

export const ChatAndReactions: React.FC<ChatAndReactionsProps> = ({
  messages,
  reactions,
  onSendMessage,
  onSendReaction,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <>
      {/* Floating emoji reactions on table */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {reactions.map((r) => (
          <div
            key={r.id}
            className="absolute floating-reaction text-3xl sm:text-4xl select-none"
            style={{
              left: '50%',
              top: '40%',
              marginLeft: `${(Math.sin(r.timestamp) * 80).toFixed(0)}px`,
            }}
          >
            {r.reaction}
          </div>
        ))}
      </div>

      {/* Bottom-right panel: reaction bar + chat button */}
      <div className="fixed bottom-safe right-3 z-40 flex flex-col items-end gap-2"
        style={{ bottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}
      >
        {/* Reaction bar */}
        <div className="flex items-center gap-0.5 bg-zinc-900/95 backdrop-blur-md px-2 py-1.5 rounded-full border border-zinc-700 shadow-xl flex-wrap justify-end max-w-[calc(100vw-80px)]">
          {EMOJI_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onSendReaction(emoji)}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-sm sm:text-base hover:scale-125 transition-transform active:scale-95"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Chat toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-zinc-950 flex items-center justify-center shadow-2xl transition-transform active:scale-95"
          title="Chat"
        >
          <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
          {messages.length > 0 && !isOpen && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-zinc-950" />
          )}
        </button>
      </div>

      {/* Chat drawer */}
      {isOpen && (
        <div
          className="fixed z-40 bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in"
          style={{
            bottom: 'max(70px, calc(env(safe-area-inset-bottom, 0px) + 70px))',
            right: '12px',
            width: 'min(340px, calc(100vw - 24px))',
            height: 'min(380px, calc(100dvh - 200px))',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-zinc-900/60 flex-shrink-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-zinc-200 tracking-wider uppercase">
                Table Chat
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-zinc-400 hover:text-white p-1 rounded-md transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-2 font-sans text-xs min-h-0">
            {messages.length === 0 ? (
              <div className="text-zinc-600 text-center my-auto italic">
                No messages yet. Say hello!
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`p-2 rounded-xl ${
                    m.isSystem
                      ? 'bg-zinc-900/50 text-amber-400/90 font-mono text-[10px] text-center border border-amber-500/10'
                      : 'bg-zinc-900/80 text-zinc-200 border border-zinc-800/60'
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

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-2 border-t border-zinc-800 flex gap-2 flex-shrink-0">
            <input
              type="text"
              placeholder="Send message…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={150}
              className="flex-1 min-w-0 bg-zinc-900 border border-zinc-700 text-zinc-100 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="px-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-zinc-950 font-bold rounded-xl transition flex items-center justify-center flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
