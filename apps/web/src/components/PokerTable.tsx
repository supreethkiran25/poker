import React, { useState } from 'react';
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
import { soundManager } from '../audio/sound-manager.js';
import { Volume2, VolumeX, History, LogOut, Shield } from 'lucide-react';

interface PokerTableProps {
  roomState: RoomPublicState;
  gameState: GamePublicState;
  myPlayerId: string;
  onAction: (type: ActionType, amount?: number) => void;
  onLeaveRoom: () => void;
}

export const PokerTable: React.FC<PokerTableProps> = ({
  roomState,
  gameState,
  myPlayerId,
  onAction,
  onLeaveRoom,
}) => {
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());
  const [showHistory, setShowHistory] = useState(false);

  const me = gameState.players.find((p) => p.id === myPlayerId);
  const isMyTurn = me?.isTurn ?? false;
  const opponents = gameState.players.filter((p) => p.id !== myPlayerId);

  const toggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const totalSeats = roomState.config.maxPlayers;
  const mySeatIndex = me ? me.seatIndex : 0;

  /**
   * Position OPPONENT players around the top arc of the oval (0° to 180°, i.e. top half).
   * We map each opponent's relative position to an angle in the top semicircle
   * so they never overlap the bottom zone reserved for the current player.
   *
   * Using ellipse percentages:
   *   rx = 44%  (horizontal radius of the ellipse, percent of container width)
   *   ry = 38%  (vertical radius, percent of container height)
   *
   * The felt surface has overflow:visible so pods can sit on the rail.
   */
  const getOpponentStyle = (seatIndex: number) => {
    const totalOpponents = opponents.length;
    const myIdx = opponents.findIndex((p) => p.seatIndex === seatIndex);
    if (myIdx === -1) return {};

    // Spread opponents across top 200° arc (from -100° to +100° relative to top)
    // Top = 270° in standard trig (or -90°). We spread ±100° around the top.
    const spanDeg = Math.min(200, totalOpponents * 45 + 30);
    const startDeg = 270 - spanDeg / 2;
    const stepDeg = totalOpponents <= 1 ? 0 : spanDeg / (totalOpponents - 1);
    const angleDeg = startDeg + myIdx * stepDeg;
    const angleRad = (angleDeg * Math.PI) / 180;

    const rx = 44;
    const ry = 38;
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
    <div
      className="relative flex flex-col bg-[#06080d] select-none"
      style={{ width: '100%', height: '100dvh', overflow: 'hidden' }}
    >
      {/* ══ TOP STATUS BAR ══ */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 z-30 gap-2" style={{ minHeight: '48px' }}>
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900/95 rounded-xl border border-zinc-800 text-[11px] font-mono flex-shrink-0">
            <span className="text-amber-400 font-black">♠</span>
            <span className="text-amber-400 font-bold">TABLE:</span>
            <span className="text-white font-bold tracking-widest">{roomState.code}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900/90 rounded-xl border border-zinc-800 text-[11px] font-mono text-zinc-400">
            <span>Hand #{gameState.handNumber}</span>
            <span className="text-zinc-600">•</span>
            <span>{formatRupee(roomState.config.smallBlind)}/{formatRupee(roomState.config.bigBlind)}</span>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-zinc-900/50 rounded-full border border-zinc-800/60 max-w-xs">
          <Shield className="w-3 h-3 text-amber-400 flex-shrink-0" />
          <span className="text-[10px] text-zinc-500 font-mono truncate">{VIRTUAL_CURRENCY_DISCLAIMER}</span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={toggleSound} className="p-2 bg-zinc-900/90 hover:bg-zinc-800 rounded-xl border border-zinc-800 transition" title={isMuted ? 'Unmute' : 'Mute'}>
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>
          <button onClick={() => setShowHistory(true)} className="p-2 bg-zinc-900/90 hover:bg-zinc-800 rounded-xl border border-zinc-800 transition" title="Hand History">
            <History className="w-4 h-4 text-amber-400" />
          </button>
          <button onClick={onLeaveRoom} className="p-2 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 rounded-xl border border-zinc-800 transition" title="Leave">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ══ TABLE ARENA ══ */}
      <div className="flex-1 flex items-center justify-center px-2 min-h-0">
        {/*
          Outer leather rail.
          Uses aspect-ratio 16/9 and clamps height so the table never overflows.
          Player pods for OPPONENTS are absolutely positioned on the felt.
        */}
        <div
          className="poker-table-outer-rail relative w-full"
          style={{
            aspectRatio: '16 / 9',
            maxWidth: 'min(100%, calc((100dvh - 210px) * 16 / 9))',
            maxHeight: 'calc(100dvh - 210px)',
          }}
        >
          {/* Woven felt surface */}
          <div className="poker-felt-surface w-full h-full relative flex flex-col items-center justify-center">
            {/* Racetrack betting line */}
            <div className="poker-betting-line" />

            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.035]">
              <span className="font-serif text-amber-100 font-black tracking-[0.3em] text-2xl sm:text-4xl md:text-6xl whitespace-nowrap">
                ROYAL CLUB
              </span>
            </div>

            {/* ── Opponents positioned on the oval rim ── */}
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
                />
              </div>
            ))}

            {/* ── CENTER ZONE: Pot + Community Cards (clean, never overlapped) ── */}
            <div className="relative z-20 flex flex-col items-center gap-2 px-4">
              {/* Pot */}
              <div className="flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-amber-500/40 shadow-xl">
                <span className="text-[10px] sm:text-xs uppercase tracking-widest text-amber-400 font-mono font-black">POT</span>
                <span className="text-[10px] text-amber-500/60 font-mono">|</span>
                <span className="text-sm sm:text-base font-black text-amber-200 font-mono">
                  {formatRupee(gameState.pot)}
                </span>
              </div>

              {/* Side pots */}
              {gameState.sidePots && gameState.sidePots.length > 1 && (
                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                  {gameState.sidePots.map((sp, idx) => (
                    <span key={idx} className="text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/70 border border-zinc-700 text-amber-300">
                      {idx === 0 ? 'MAIN' : `SIDE ${idx}`}: {formatRupee(sp.amount)}
                    </span>
                  ))}
                </div>
              )}

              {/* Community Cards */}
              <CommunityCards cards={gameState.communityCards} phase={gameState.phase} />

              {/* Phase badge */}
              <div className="px-3 py-0.5 bg-black/60 rounded-full border border-emerald-500/25 text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-emerald-400/80">
                {gameState.phase.replace(/_/g, ' ')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ BOTTOM ZONE: My Seat + Hole Cards + Action Bar ══ */}
      <div
        className="flex-shrink-0 flex flex-col items-center z-30"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}
      >
        {/* My seat pod — shown inline above cards */}
        {me && (
          <div className="mb-1">
            <PlayerSeat
              player={me}
              isMe={true}
              dealerSeat={gameState.dealerSeat}
              smallBlindSeat={gameState.smallBlindSeat}
              bigBlindSeat={gameState.bigBlindSeat}
              turnDuration={gameState.turnDuration}
              compact={false}
            />
          </div>
        )}

        {/* Hole cards */}
        {me && me.holeCards && me.holeCards.length > 0 && !me.hasFolded && (
          <div className="flex items-center gap-2.5 mb-2">
            {me.holeCards.map((c, idx) => (
              <CardView key={idx} card={c} size="lg" />
            ))}
          </div>
        )}

        {/* Action bar */}
        <div className="w-full max-w-xl px-2">
          <ActionBar
            isMyTurn={isMyTurn}
            legalActions={gameState.legalActions}
            pot={gameState.pot}
            currentBet={gameState.currentBet}
            myChips={me?.chips ?? 0}
            onAction={onAction}
          />
        </div>
      </div>

      {/* ══ SHOWDOWN ══ */}
      {gameState.lastHandResult && gameState.phase === 'HAND_COMPLETE' && (
        <ShowdownBanner
          result={gameState.lastHandResult}
          players={gameState.players}
          myPlayerId={myPlayerId}
        />
      )}

      {/* ══ HAND HISTORY MODAL ══ */}
      {showHistory && (
        <HandHistoryModal
          roomCode={roomState.code}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
};
