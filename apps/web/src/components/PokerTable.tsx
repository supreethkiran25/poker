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

  const toggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const totalSeats = roomState.config.maxPlayers;
  const mySeatIndex = me ? me.seatIndex : 0;

  /**
   * Position players around an ellipse. rx/ry are percentage radii of the
   * table container. Bottom player (me) starts at angle 90° (bottom center).
   */
  const getSeatPositionStyle = (seatIndex: number) => {
    const relativePos = (seatIndex - mySeatIndex + totalSeats) % totalSeats;
    const angleDeg = (relativePos / totalSeats) * 360 + 90;
    const angleRad = (angleDeg * Math.PI) / 180;

    // Slightly inset from edge so pods don't clip the rail
    const rx = 41;
    const ry = 34;
    const left = 50 + rx * Math.cos(angleRad);
    const top = 50 + ry * Math.sin(angleRad);

    return {
      left: `${left.toFixed(1)}%`,
      top: `${top.toFixed(1)}%`,
      transform: 'translate(-50%, -50%)',
    };
  };

  return (
    <div className="relative w-full h-dvh flex flex-col bg-[#06080d] select-none overflow-hidden">

      {/* ── TOP STATUS BAR ── */}
      <div className="flex-shrink-0 w-full flex items-center justify-between z-30 px-3 py-2 gap-2">
        {/* Left: table code + blind info */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900/90 rounded-xl border border-zinc-800 text-xs font-mono flex-shrink-0">
            <span className="text-amber-400 font-bold">TABLE:</span>
            <span className="text-white font-bold tracking-wider">{roomState.code}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900/90 rounded-xl border border-zinc-800 text-xs font-mono text-zinc-400 min-w-0">
            <span className="truncate">Hand #{gameState.handNumber} • {formatRupee(roomState.config.smallBlind)}/{formatRupee(roomState.config.bigBlind)}</span>
          </div>
        </div>

        {/* Center: disclaimer (desktop only) */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-zinc-900/60 rounded-full border border-zinc-800 text-[10px] text-zinc-400 font-mono max-w-xs truncate">
          <Shield className="w-3 h-3 text-amber-400 flex-shrink-0" />
          <span className="truncate">{VIRTUAL_CURRENCY_DISCLAIMER}</span>
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={toggleSound}
            className="p-2 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 rounded-xl border border-zinc-800 transition"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className="p-2 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 rounded-xl border border-zinc-800 transition"
            title="Hand History"
          >
            <History className="w-4 h-4 text-amber-400" />
          </button>
          <button
            onClick={onLeaveRoom}
            className="p-2 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 rounded-xl border border-zinc-800 transition"
            title="Leave Room"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── POKER TABLE (fills remaining vertical space, leaves room for bottom bar) ── */}
      <div className="flex-1 flex items-center justify-center px-2 py-1 min-h-0">
        {/* Outer leather rail — aspect-ratio locks the oval shape */}
        <div
          className="poker-table-outer-rail w-full"
          style={{
            aspectRatio: '16 / 9',
            maxWidth: 'min(100%, calc((100dvh - 200px) * 16 / 9))',
            maxHeight: 'calc(100dvh - 200px)',
          }}
        >
          {/* Woven felt surface */}
          <div className="poker-felt-surface w-full h-full relative flex flex-col items-center justify-center">
            {/* Racetrack betting line */}
            <div className="poker-betting-line" />

            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04]">
              <span className="font-serif text-amber-200 font-black tracking-widest text-3xl sm:text-5xl md:text-7xl whitespace-nowrap">
                ROYAL CLUB
              </span>
            </div>

            {/* Pot display */}
            <div className="flex flex-col items-center z-20 mb-1 sm:mb-2">
              <div className="flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-3 py-1 rounded-full border border-amber-500/40 shadow-xl">
                <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-amber-400 font-mono font-bold">POT:</span>
                <span className="text-xs sm:text-sm font-black text-amber-200 font-mono">
                  {formatRupee(gameState.pot)}
                </span>
              </div>
              {/* Side pots */}
              {gameState.sidePots && gameState.sidePots.length > 1 && (
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap justify-center">
                  {gameState.sidePots.map((sp, idx) => (
                    <span
                      key={idx}
                      className="text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/80 border border-zinc-700 text-amber-300"
                    >
                      {idx === 0 ? 'MAIN' : `SIDE ${idx}`}: {formatRupee(sp.amount)}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Community Cards */}
            <div className="z-20">
              <CommunityCards cards={gameState.communityCards} phase={gameState.phase} />
            </div>

            {/* Phase badge */}
            <div className="mt-1.5 px-2.5 py-0.5 bg-black/60 rounded-full border border-emerald-500/30 text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-emerald-400">
              {gameState.phase}
            </div>

            {/* Player seats — absolutely positioned around the ellipse */}
            {gameState.players.map((player) => (
              <div
                key={player.id}
                style={getSeatPositionStyle(player.seatIndex)}
                className="absolute z-20"
              >
                <PlayerSeat
                  player={player}
                  isMe={player.id === myPlayerId}
                  dealerSeat={gameState.dealerSeat}
                  smallBlindSeat={gameState.smallBlindSeat}
                  bigBlindSeat={gameState.bigBlindSeat}
                  turnDuration={gameState.turnDuration}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BOTTOM: HOLE CARDS + ACTION BAR ── */}
      <div className="flex-shrink-0 w-full flex flex-col items-center gap-2 z-30 px-2 pb-3 pt-1">
        {/* Hole cards */}
        {me && me.holeCards && me.holeCards.length > 0 && !me.hasFolded && (
          <div className="flex items-center gap-2 hover:-translate-y-1 transition-transform">
            {me.holeCards.map((c, idx) => (
              <CardView key={idx} card={c} size="lg" />
            ))}
          </div>
        )}

        {/* Action bar */}
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
      </div>

      {/* ── SHOWDOWN BANNER ── */}
      {gameState.lastHandResult && gameState.phase === 'HAND_COMPLETE' && (
        <ShowdownBanner
          result={gameState.lastHandResult}
          players={gameState.players}
          myPlayerId={myPlayerId}
        />
      )}

      {/* ── HAND HISTORY MODAL ── */}
      {showHistory && (
        <HandHistoryModal
          roomCode={roomState.code}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
};
