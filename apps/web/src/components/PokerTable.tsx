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
import { TableAlertBanner } from './TableAlertBanner.js';
import { RebuyModal } from './RebuyModal.js';
import { GameSummaryModal } from './GameSummaryModal.js';
import type { TableAlert } from '../hooks/useSocket.js';
import {
  Mic,
  MicOff,
  MessageSquare,
  History,
  BookOpen,
  Settings,
  LogOut,
  Clock,
  Coins,
  Check,
  Play,
  ChevronLeft,
  Trophy,
} from 'lucide-react';

interface PokerTableProps {
  roomState: RoomPublicState;
  gameState: GamePublicState;
  myPlayerId: string;
  isVoiceActive?: boolean;
  isMuted?: boolean;
  speakingPeers?: Record<string, boolean>;
  tableAlerts?: TableAlert[];
  onToggleMute?: () => void;
  onAction: (type: ActionType, amount?: number) => void;
  onLeaveRoom: () => void;
  onOpenChat: () => void;
  onRebuyChips?: (amount?: number) => void;
  onReadyForNextHand?: (ready: boolean) => void;
  onDealNextHand?: () => void;
  unreadChatCount?: number;
}

export const PokerTable: React.FC<PokerTableProps> = ({
  roomState,
  gameState,
  myPlayerId,
  isVoiceActive = false,
  isMuted = false,
  speakingPeers = {},
  tableAlerts = [],
  onToggleMute,
  onAction,
  onLeaveRoom,
  onOpenChat,
  onRebuyChips,
  onReadyForNextHand,
  onDealNextHand,
  unreadChatCount = 0,
}) => {
  const [showSummary, setShowSummary] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRebuy, setShowRebuy] = useState(false);
  const [showShowdown, setShowShowdown] = useState(true);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [isMobilePortrait, setIsMobilePortrait] = useState(() => window.innerWidth < 640);

  useEffect(() => {
    if (gameState.phase === 'HAND_COMPLETE') {
      setShowShowdown(true);
    }
  }, [gameState.phase, gameState.handNumber]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobilePortrait(window.innerWidth < 640 && window.innerHeight > window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const me = gameState.players.find((p) => p.id === myPlayerId);
  const isMyTurn = me?.isTurn ?? false;
  const opponents = gameState.players.filter((p) => p.id !== myPlayerId);
  const isHost = me?.isHost ?? false;

  const nextHandReadyList = roomState.nextHandReadyPlayerIds || [];
  const amIReadyForNext = nextHandReadyList.includes(myPlayerId);

  // Auto prompt rebuy if player has 0 chips during active play (not during HAND_COMPLETE where ShowdownBanner has native rebuy)
  useEffect(() => {
    if (me && me.chips === 0 && gameState.phase !== 'HAND_COMPLETE') {
      setShowRebuy(true);
    }
  }, [me?.chips, gameState.phase]);

  // Turn timer countdown
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
   * Distribute opponents around the perimeter ellipse matching Screen 6.
   * In mobile portrait: rx = 41%, ry = 43%.
   * In desktop landscape: rx = 44%, ry = 38%.
   * Opponents spread along the 240° arc passing through the top (270°).
   */
  const getOpponentStyle = (seatIndex: number) => {
    const totalOpponents = opponents.length;
    const oppIdx = opponents.findIndex((p) => p.seatIndex === seatIndex);
    if (oppIdx === -1) return {};

    // Arc from 150° (lower left) through 270° (top center) to 390°/30° (lower right)
    const arcSpan = 240;
    const startAngle = 150;
    const step = totalOpponents <= 1 ? 0 : arcSpan / (totalOpponents + 1);
    const angleDeg = totalOpponents === 1 ? 270 : startAngle + (oppIdx + 1) * step;
    const angleRad = (angleDeg * Math.PI) / 180;

    const rx = isMobilePortrait ? 41 : 44;
    const ry = isMobilePortrait ? 43 : 38;
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

  const handleRebuySubmit = (amount: number) => {
    setShowRebuy(false);
    if (onRebuyChips) {
      onRebuyChips(amount);
    }
  };

  return (
    <div className="relative flex flex-col w-full h-dvh bg-[#06080d] text-zinc-100 select-none overflow-hidden">
      {/* ── Table Alert Banner (Leave, Disconnect, Rebuy alerts) ── */}
      <TableAlertBanner alerts={tableAlerts} />

      {/* ══ TOP NAVIGATION & STATUS BAR (Screen 5 & 6 Reference) ══ */}
      <header className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md z-30 min-h-[48px]">
        {/* Left: Screen 5 Breadcrumb `< Hand #124578` + Table code */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onLeaveRoom}
            className="flex items-center gap-1 text-xs font-mono font-bold text-zinc-300 hover:text-white transition p-1 hover:bg-zinc-900 rounded-lg"
            title="Back to Lobby"
          >
            <ChevronLeft className="w-4 h-4 text-amber-400" />
            <span>Hand #{gameState.handNumber}</span>
          </button>

          <span className="text-zinc-700 hidden sm:inline">•</span>

          <div className="hidden xs:flex items-center gap-1.5 px-2 py-0.5 bg-zinc-900 rounded-lg border border-zinc-800 text-[11px] font-mono flex-shrink-0">
            <span className="text-amber-400 font-bold">♠</span>
            <span className="text-amber-300 font-bold tracking-wider">{roomState.code}</span>
          </div>

          <span className="text-zinc-600 hidden md:inline">•</span>
          <span className="text-[11px] font-mono text-zinc-400 hidden md:inline">
            {formatRupee(roomState.config.smallBlind)}/{formatRupee(roomState.config.bigBlind)} Blinds
          </span>
        </div>

        {/* Right: Mic Voice Toggle, Rebuy, Chat, Settings, Leave */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Quick Rebuy Button */}
          <button
            onClick={() => setShowRebuy(true)}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 text-amber-400 rounded-xl border border-amber-500/30 transition flex items-center gap-1 text-xs font-mono font-bold"
            title="Rebuy Chips"
          >
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">REBUY</span>
          </button>

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

          {/* Session Summary (Screen 10) */}
          <button
            onClick={() => setShowSummary(true)}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl border border-zinc-800 transition hidden sm:flex"
            title="Session Summary"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
          </button>

          {/* Hand History */}
          <button
            onClick={() => setShowHistory(true)}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl border border-zinc-800 transition hidden sm:flex"
            title="Hand History"
          >
            <History className="w-4 h-4 text-amber-400" />
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

      {/* ══ TABLE ARENA (Portrait Oval on Mobile, Landscape on Desktop) ══ */}
      <main className="flex-1 flex items-center justify-center p-2 min-h-0 relative">
        <div
          className="poker-table-outer-rail relative transition-all duration-300"
          style={
            isMobilePortrait
              ? {
                  width: 'min(94vw, 420px)',
                  height: 'min(62vh, 520px)',
                  maxHeight: 'calc(100dvh - 170px)',
                  borderRadius: '120px',
                }
              : {
                  width: '100%',
                  aspectRatio: '1.72 / 1',
                  maxWidth: 'min(96vw, calc((100dvh - 180px) * 1.72))',
                  maxHeight: 'calc(100dvh - 180px)',
                  borderRadius: '9999px',
                }
          }
        >
          {/* Inner Woven Green Felt Surface */}
          <div
            className="poker-felt-surface w-full h-full relative"
            style={{ borderRadius: isMobilePortrait ? '110px' : '9999px' }}
          >
            {/* Racetrack betting line */}
            <div
              className="poker-betting-line"
              style={{ borderRadius: isMobilePortrait ? '95px' : '9999px' }}
            />

            {/* PokerCircle Watermark in Center */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.04]">
              <span className="font-serif text-amber-100 font-black tracking-[0.25em] text-2xl sm:text-4xl md:text-5xl whitespace-nowrap">
                POKER CIRCLE
              </span>
            </div>

            {/* ── Opponents Positioned on Oval Perimeter ── */}
            {opponents.map((player) => (
              <div key={player.id} style={getOpponentStyle(player.seatIndex)}>
                <PlayerSeat
                  player={player}
                  isMe={false}
                  dealerSeat={gameState.dealerSeat}
                  smallBlindSeat={gameState.smallBlindSeat}
                  bigBlindSeat={gameState.bigBlindSeat}
                  turnExpiresAt={player.isTurn ? gameState.turnExpiresAt : null}
                  turnDuration={gameState.turnDuration}
                  compact={true}
                  isSpeaking={!!speakingPeers[player.id]}
                />
              </div>
            ))}

            {/* ── Table Center: Pot + Community Cards + Phase (Unified Single Column) ── */}
            <div
              className="absolute z-20 flex flex-col items-center gap-1.5 sm:gap-2 pointer-events-auto"
              style={{
                left: '50%',
                top: isMobilePortrait ? '40%' : '37%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* Pot Badge */}
              <div className="flex items-center gap-1.5 bg-black/85 backdrop-blur-md px-3.5 py-1 rounded-full border border-amber-500/40 shadow-xl pointer-events-auto">
                <span className="text-[10px] sm:text-xs uppercase tracking-widest text-amber-400 font-mono font-black">
                  POT
                </span>
                <span className="text-[10px] text-amber-500/60 font-mono">|</span>
                <span className="text-xs sm:text-sm font-black text-amber-200 font-mono">
                  {formatRupee(gameState.pot)}
                </span>
              </div>

              {/* Side Pots if any */}
              {gameState.sidePots && gameState.sidePots.length > 1 && (
                <div className="flex items-center gap-1 flex-wrap justify-center pointer-events-auto">
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
              {gameState.phase !== 'WAITING_FOR_PLAYERS' && gameState.phase !== 'STARTING' && (
                <div className="px-2.5 py-0.5 bg-black/70 rounded-full border border-emerald-500/40 text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold shadow">
                  {gameState.phase.replace(/_/g, ' ')}
                </div>
              )}
            </div>

            {/* ── Player's Hole Cards on the Felt (in front of seat) ── */}
            {me && me.holeCards && me.holeCards.length > 0 && !me.hasFolded && (
              <div
                className="absolute z-20 flex items-center -space-x-1 sm:space-x-1 pointer-events-auto"
                style={{
                  left: '50%',
                  top: isMobilePortrait ? '69%' : '66%',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {me.holeCards.map((c, idx) => (
                  <CardView
                    key={idx}
                    card={c}
                    size={isMobilePortrait ? 'sm' : 'md'}
                    dealDelayMs={idx * 140}
                    isInteractive={true}
                    tiltDeg={idx === 0 ? -4 : 4}
                  />
                ))}
              </div>
            )}

            {/* ── Screen 5: Floating Circular Timer Badge beside "You" ── */}
            {isMyTurn && secondsRemaining !== null && (
              <div
                className="absolute z-25 flex flex-col items-center justify-center pointer-events-none select-none animate-pulse"
                style={{
                  left: isMobilePortrait ? '82%' : '70%',
                  top: isMobilePortrait ? '84%' : '78%',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-zinc-950/95 border-2 border-emerald-500 shadow-2xl flex flex-col items-center justify-center p-1 backdrop-blur-md ring-4 ring-emerald-500/20">
                  <span className="text-xs sm:text-sm font-black font-mono text-white leading-none">
                    00:{secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining}
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-tighter mt-0.5">
                    Your Turn
                  </span>
                </div>
              </div>
            )}

            {/* ── "YOU" Seat Pod at Bottom Center of Oval Rail ── */}
            {me && (
              <div
                className="absolute z-25 pointer-events-auto"
                style={{
                  left: '50%',
                  top: isMobilePortrait ? '90%' : '88%',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <PlayerSeat
                  player={me}
                  isMe={true}
                  dealerSeat={gameState.dealerSeat}
                  smallBlindSeat={gameState.smallBlindSeat}
                  bigBlindSeat={gameState.bigBlindSeat}
                  turnExpiresAt={isMyTurn ? gameState.turnExpiresAt : null}
                  turnDuration={gameState.turnDuration}
                  compact={false}
                  isSpeaking={isVoiceActive && !isMuted}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ══ BOTTOM ACTION ZONE (Pinned cleanly with safe-area spacing) ══ */}
      <footer
        className="flex-shrink-0 flex flex-col items-center z-30 px-2.5 pb-2"
        style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom, 10px))' }}
      >
        <div className="w-full max-w-xl">
          {/* Phase: Hand Complete - Next Hand Auto-Continue / Controls */}
          {gameState.phase === 'HAND_COMPLETE' ? (
            <div className="w-full bg-zinc-950/95 backdrop-blur-xl p-3 rounded-2xl border border-amber-500/40 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
              <div className="text-left">
                <div className="text-xs font-bold text-amber-300">
                  Hand #{gameState.handNumber} Complete
                </div>
                <div className="text-[10px] text-zinc-400 font-mono">
                  {gameState.players.some((p) => p.chips === 0)
                    ? 'Waiting for players with 0 chips to rebuy…'
                    : 'Dealing next hand automatically…'}
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Immediate Deal Button */}
                {onDealNextHand && (
                  <button
                    onClick={onDealNextHand}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-4 h-4 fill-zinc-950" />
                    <span>Deal Now</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Active Game: Standard 4 Action Buttons */
            <ActionBar
              isMyTurn={isMyTurn}
              legalActions={gameState.legalActions}
              pot={gameState.pot}
              currentBet={gameState.currentBet}
              myChips={me?.chips ?? 0}
              secondsRemaining={secondsRemaining}
              turnDuration={gameState.turnDuration}
              onAction={onAction}
            />
          )}
        </div>
      </footer>

      {/* ══ SHOWDOWN BANNER ══ */}
      {gameState.lastHandResult && gameState.phase === 'HAND_COMPLETE' && showShowdown && (
        <ShowdownBanner
          result={gameState.lastHandResult}
          players={gameState.players}
          myPlayerId={myPlayerId}
          isHost={isHost}
          isReadyForNext={amIReadyForNext}
          readyPlayerCount={nextHandReadyList.length}
          totalActivePlayerCount={gameState.players.filter((p) => p.chips > 0).length}
          onReadyForNext={() => onReadyForNextHand && onReadyForNextHand(!amIReadyForNext)}
          onDealNext={onDealNextHand}
          onRebuy={() => setShowRebuy(true)}
          onClose={() => setShowShowdown(false)}
        />
      )}

      {/* ══ REBUY MODAL (when chips hit 0 or player clicks Rebuy) ══ */}
      <RebuyModal
        startingChips={roomState.config.startingChips}
        onRebuy={handleRebuySubmit}
        onLeave={onLeaveRoom}
        isOpen={showRebuy}
      />

      {/* ══ HAND HISTORY MODAL ══ */}
      {showHistory && (
        <HandHistoryModal
          roomCode={roomState.code}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* ══ RULES MODAL ══ */}
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}

      {/* ══ TABLE SETTINGS MODAL ══ */}
      {showSettings && (
        <TableSettingsModal
          isVoiceActive={isVoiceActive}
          isMuted={isMuted}
          onToggleMute={onToggleMute || (() => {})}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* ══ SESSION COMPLETE SUMMARY MODAL (Screen 10) ══ */}
      {showSummary && (
        <GameSummaryModal
          players={gameState.players.map((p) => ({
            id: p.id,
            name: p.name,
            startingChips: roomState.config.startingChips,
            endingChips: p.chips,
            isMe: p.id === myPlayerId,
          }))}
          totalHands={gameState.handNumber}
          biggestPot={gameState.pot}
          onClose={() => setShowSummary(false)}
          onBackToHome={onLeaveRoom}
        />
      )}
    </div>
  );
};
