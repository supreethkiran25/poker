import React, { useState } from 'react';
import type { ChatMessage, ReactionItem } from '@poker/shared';
import { MessageSquare, Send, X, Smile } from 'lucide-react';

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
      {/* Floating Reactions on table */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {reactions.map((r) => (
          <div
            key={r.id}
            className="absolute floating-reaction text-4xl select-none"
            style={{
              left: '50%',
              top: '40%',
              marginLeft: `${(Math.sin(r.timestamp) * 120).toFixed(0)}px`,
            }}
          >
            {r.reaction}
          </div>
        ))}
      </div>

      {/* Floating Reaction Bar at bottom right */}
      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2">
        {/* Quick Reaction buttons */}
        <div className="flex items-center gap-1 bg-zinc-900/90 backdrop-blur-md px-2 py-1.5 rounded-full border border-zinc-700 shadow-xl">
          {EMOJI_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onSendReaction(emoji)}
              className="w-8 h-8 flex items-center justify-center text-base hover:scale-125 transition-transform active:scale-95"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Chat Toggle button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-11 h-11 rounded-full bg-gradient-to-tr from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-zinc-950 flex items-center justify-center shadow-2xl transition-transform active:scale-95"
          title="Open Chat"
        >
          <MessageSquare className="w-5 h-5" />
          {messages.length > 0 && !isOpen && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-zinc-950"></span>
          )}
        </button>
      </div>

      {/* Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-16 right-4 w-80 sm:w-96 h-96 bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl z-40 flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/60">
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

          {/* Messages Feed */}
          <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-2 font-sans text-xs">
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
                      ? 'bg-zinc-900/50 text-amber-400/90 font-mono text-[11px] text-center border border-amber-500/10'
                      : 'bg-zinc-900/80 text-zinc-200 border border-zinc-800/60'
                  }`}
                >
                  {!m.isSystem && (
                    <span className="font-bold text-amber-300 mr-1.5">
                      {m.playerName}:
                    </span>
                  )}
                  <span>{m.message}</span>
                </div>
              ))
            )}
          </div>

          {/* Input form */}
          <form onSubmit={handleSubmit} className="p-2 border-t border-zinc-800 flex gap-2">
            <input
              type="text"
              placeholder="Send message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={150}
              className="flex-1 bg-zinc-900 border border-zinc-700 text-zinc-100 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="px-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-zinc-950 font-bold rounded-xl transition flex items-center justify-center"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
