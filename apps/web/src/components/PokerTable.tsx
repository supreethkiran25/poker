import React, { useState, useEffect } from 'react';
import type {
  GamePublicState,
  RoomPublicState,
  ActionType,
} from '@poker/shared';
import { formatRupee, VIRTUAL_CURRENCY_DISCLAIMER } from '@poker/shared';
import { PlayerSeat } from './PlayerSeat.js';
import { CommunityCards } from './CommunityCards.js';
import { CardView } from './CardView.js';
import { ActionBar } from './ActionBar.js';
import { ShowdownBanner } from './ShowdownBanner.js';
import { HandHistoryModal } from './HandHistoryModal.js';
import { RulesModal } from './RulesModal.js';
import { TableSettingsModal } from './TableSettingsModal.js';
import { soundManager } from '../audio/sound-manager.js';
import {
  Mic,
  MicOff,
  MessageSquare,
  History,
  BookOpen,
  Settings,
  LogOut,
  Clock,
  Shield,
} from 'lucide-react';

interface PokerTableProps {
  roomState: RoomPublicState;
  gameState: GamePublicState;
  myPlayerId: string;
  isVoiceActive?: boolean;
  isMuted?: boolean;
  speakingPeers?: Record<string, boolean>;
  onToggleMute?: () => void;
  onAction: (type: ActionType, amount?: number) => void;
  onLeaveRoom: () => void;
  onOpenChat: () => void;
  unreadChatCount?: number;
}

export const PokerTable: React.FC<PokerTableProps> = ({
  roomState,
  gameState,
  myPlayerId,
  isVoiceActive = false,
  isMuted = false,
  speakingPeers = {},
  onToggleMute,
  onAction,
  onLeaveRoom,
  onOpenChat,
  unreadChatCount = 0,
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  const me = gameState.players.find((p) => p.id === myPlayerId);
  const isMyTurn = me?.isTurn ?? false;
  const opponents = gameState.players.filter((p) => p.id !== myPlayerId);

  // Turn timer countdown calculation
  useEffect(() => {
    if (!gameState.turnExpiresAt) {
      setSecondsRemaining(null);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.ceil((gameState.turnExpiresAt! - now) / 1000));
      setSecondsRemaining(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 500);
    return () => clearInterval(interval);
  }, [gameState.turnExpiresAt]);

  /**
   * Distribute opponents neatly along the top arc (from 140° to 40°, or left-to-right top half)
   * Using parametric ellipse coordinates relative to the felt dimensions:
   *   left: 50% + rx * cos(angle)
   *   top: 50% + ry * sin(angle)
   */
  const getOpponentStyle = (seatIndex: number) => {
    const totalOpponents = opponents.length;
    const oppIdx = opponents.findIndex((p) => p.seatIndex === seatIndex);
    if (oppIdx === -1) return {};

    // Spread across top arc: from 200° to 340° (where 270° is top center)
    const arcStart = 200;
    const arcEnd = 340;
    const step = totalOpponents <= 1 ? 0 : (arcEnd - arcStart) / (totalOpponents - 1);
    const angleDeg = totalOpponents === 1 ? 270 : arcStart + oppIdx * step;
    const angleRad = (angleDeg * Math.PI) / 180;

    const rx = 44; // percent horizontal radius
    const ry = 38; // percent vertical radius
    const left = 50 + rx * Math.cos(angleRad);
    const top = 50 + ry * Math.sin(angleRad);

    return {
      position: 'absolute' as const,
      left: `${left.toFixed(1)}%`,
      top: `${top.toFixed(1)}%`,
      transform: 'translate(-50%, -50%)',
      zIndex: 20,
    };
  };

  return (
    <div className="relative flex flex-col w-full h-dvh bg-[#06080d] text-zinc-100 select-none overflow-hidden">
      {/* ══ TOP NAVIGATION & CONTROLS BAR (Screen 6 Mobile Header) ══ */}
      <header className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md z-30 min-h-[48px]">
        {/* Left: Table code & hand info */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 rounded-xl border border-zinc-800 text-[11px] font-mono flex-shrink-0">
            <span className="text-amber-400 font-bold">♠</span>
            <span className="text-zinc-400 font-bold hidden sm:inline">TABLE:</span>
            <span className="text-amber-300 font-bold tracking-wider">{roomState.code}</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-400">
            <span>Hand #{gameState.handNumber}</span>
            <span className="text-zinc-600 hidden xs:inline">•</span>
            <span className="hidden xs:inline">{formatRupee(roomState.config.smallBlind)}/{formatRupee(roomState.config.bigBlind)}</span>
          </div>
        </div>

        {/* Right: Mic Voice Toggle, Chat, Settings, Rules, Leave */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Voice Chat (Mic) Button */}
          {onToggleMute && (
            <button
              onClick={onToggleMute}
              className={`p-2 rounded-xl border transition flex items-center gap-1 ${
                isVoiceActive && !isMuted
                  ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 ring-2 ring-emerald-500/30'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
              title={isVoiceActive && !isMuted ? 'Mute Mic' : 'Turn on Mic to talk'}
            >
              {isVoiceActive && !isMuted ? (
                <Mic className="w-4 h-4 text-emerald-400 animate-pulse" />
              ) : (
                <MicOff className="w-4 h-4 text-rose-400" />
              )}
            </button>
          )}

          {/* Chat Drawer Toggle */}
          <button
            onClick={onOpenChat}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl border border-zinc-800 transition relative"
            title="Chat & Reactions"
          >
            <MessageSquare className="w-4 h-4 text-amber-400" />
            {unreadChatCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-zinc-950" />
            )}
          </button>

          {/* Hand History */}
          <button
            onClick={() => setShowHistory(true)}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl border border-zinc-800 transition hidden sm:flex"
            title="Hand History"
          >
            <History className="w-4 h-4 text-amber-400" />
          </button>

          {/* Rules */}
          <button
            onClick={() => setShowRules(true)}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl border border-zinc-800 transition hidden xs:flex"
            title="Rules"
          >
            <BookOpen className="w-4 h-4 text-zinc-300" />
          </button>

          {/* Table Settings */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl border border-zinc-800 transition"
            title="Settings"
          >
            <Settings className="w-4 h-4 text-zinc-300" />
          </button>

          {/* Leave Table */}
          <button
            onClick={onLeaveRoom}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 rounded-xl border border-zinc-800 transition"
            title="Leave Table"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ══ TABLE ARENA (Felt, Racetrack, Players, Pot, Community Cards) ══ */}
      <main className="flex-1 flex items-center justify-center p-2 min-h-0 relative">
        {/* Outer Oval Leather Rail matching reference Screen 5 & 6 */}
        <div
          className="poker-table-outer-rail relative w-full"
          style={{
            aspectRatio: '16 / 9',
            maxWidth: 'min(100%, calc((100dvh - 210px) * 16 / 9))',
            maxHeight: 'calc(100dvh - 210px)',
          }}
        >
          {/* Inner Woven Green Felt Surface */}
          <div className="poker-felt-surface w-full h-full relative flex flex-col items-center justify-center">
            {/* Racetrack betting line */}
            <div className="poker-betting-line" />

            {/* PokerCircle Watermark in Felt Center */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.04]">
              <span className="font-serif text-amber-100 font-black tracking-[0.25em] text-2xl sm:text-4xl md:text-5xl whitespace-nowrap">
                POKER CIRCLE
              </span>
            </div>

            {/* ── Opponent Player Pods on Table Rim ── */}
            {opponents.map((player) => (
              <div key={player.id} style={getOpponentStyle(player.seatIndex)}>
                <PlayerSeat
                  player={player}
                  isMe={false}
                  dealerSeat={gameState.dealerSeat}
                  smallBlindSeat={gameState.smallBlindSeat}
                  bigBlindSeat={gameState.bigBlindSeat}
                  turnDuration={gameState.turnDuration}
                  compact={true}
                  isSpeaking={!!speakingPeers[player.id]}
                />
              </div>
            ))}

            {/* ── Center Zone: Pot + Community Cards + Phase ── */}
            <div className="relative z-20 flex flex-col items-center gap-2 px-3">
              {/* Main Pot Chip Badge */}
              <div className="flex items-center gap-1.5 bg-black/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-amber-500/40 shadow-xl">
                <span className="text-[10px] sm:text-xs uppercase tracking-widest text-amber-400 font-mono font-black">
                  POT
                </span>
                <span className="text-[10px] text-amber-500/60 font-mono">|</span>
                <span className="text-sm sm:text-base font-black text-amber-200 font-mono">
                  {formatRupee(gameState.pot)}
                </span>
              </div>

              {/* Side Pots if any */}
              {gameState.sidePots && gameState.sidePots.length > 1 && (
                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                  {gameState.sidePots.map((sp, idx) => (
                    <span
                      key={idx}
                      className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-black/70 border border-zinc-700 text-amber-300"
                    >
                      {idx === 0 ? 'MAIN' : `SIDE ${idx}`}: {formatRupee(sp.amount)}
                    </span>
                  ))}
                </div>
              )}

              {/* 5 Community Cards */}
              <CommunityCards cards={gameState.communityCards} phase={gameState.phase} />

              {/* Phase Badge */}
              <div className="px-2.5 py-0.5 bg-black/60 rounded-full border border-emerald-500/30 text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-emerald-400/90">
                {gameState.phase.replace(/_/g, ' ')}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ══ BOTTOM ZONE: My Seat Pod + Hole Cards + Action Bar (Pinned cleanly) ══ */}
      <footer
        className="flex-shrink-0 flex flex-col items-center z-30 px-2"
        style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom, 10px))' }}
      >
        {/* Row with Player Pod, Turn Countdown & Hole Cards */}
        <div className="flex items-center justify-center gap-3 mb-2 flex-wrap">
          {/* My Seat Pod */}
          {me && (
            <PlayerSeat
              player={me}
              isMe={true}
              dealerSeat={gameState.dealerSeat}
              smallBlindSeat={gameState.smallBlindSeat}
              bigBlindSeat={gameState.bigBlindSeat}
              turnDuration={gameState.turnDuration}
              compact={false}
              isSpeaking={isVoiceActive && !isMuted}
            />
          )}

          {/* Turn Countdown Badge (Screen 6 reference) */}
          {isMyTurn && secondsRemaining !== null && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 border border-amber-500/50 rounded-2xl animate-pulse">
              <Clock className="w-4 h-4 text-amber-400" />
              <div className="text-center">
                <div className="text-[9px] uppercase tracking-wider font-bold text-amber-400 leading-none">
                  Your Turn
                </div>
                <div className="text-xs font-mono font-black text-white leading-tight">
                  00:{secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining}
                </div>
              </div>
            </div>
          )}

          {/* Hole Cards */}
          {me && me.holeCards && me.holeCards.length > 0 && !me.hasFolded && (
            <div className="flex items-center gap-2">
              {me.holeCards.map((c, idx) => (
                <CardView key={idx} card={c} size="lg" />
              ))}
            </div>
          )}
        </div>

        {/* Action Bar (Fold, Check, Call, Raise) */}
        <div className="w-full max-w-xl">
          <ActionBar
            isMyTurn={isMyTurn}
            legalActions={gameState.legalActions}
            pot={gameState.pot}
            currentBet={gameState.currentBet}
            myChips={me?.chips ?? 0}
            onAction={onAction}
          />
        </div>
      </footer>

      {/* ══ SHOWDOWN BANNER ══ */}
      {gameState.lastHandResult && gameState.phase === 'HAND_COMPLETE' && (
        <ShowdownBanner
          result={gameState.lastHandResult}
          players={gameState.players}
          myPlayerId={myPlayerId}
        />
      )}

      {/* ══ MODALS: Hand History, Rules, Table Settings ══ */}
      {showHistory && (
        <HandHistoryModal
          roomCode={roomState.code}
          onClose={() => setShowHistory(false)}
        />
      )}

      {showRules && <RulesModal onClose={() => setShowRules(false)} />}

      {showSettings && (
        <TableSettingsModal
          isVoiceActive={isVoiceActive}
          isMuted={isMuted}
          onToggleMute={onToggleMute || (() => {})}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};
