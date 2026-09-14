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

  const getSeatPositionClass = (seatIndex: number) => {
    const relativePos = (seatIndex - mySeatIndex + totalSeats) % totalSeats;
    const angleDeg = (relativePos / totalSeats) * 360 + 90;
    const angleRad = (angleDeg * Math.PI) / 180;

    const rx = 43;
    const ry = 36;
    const left = 50 + rx * Math.cos(angleRad);
    const top = 50 + ry * Math.sin(angleRad);

    return {
      left: `${left.toFixed(1)}%`,
      top: `${top.toFixed(1)}%`,
      transform: 'translate(-50%, -50%)',
    };
  };

  return (
    <div className="relative w-full h-screen flex flex-col items-center justify-between overflow-hidden bg-[#06080d] p-2 sm:p-4 select-none">
      {/* Top Club Status Bar */}
      <div className="w-full max-w-6xl flex items-center justify-between z-30 px-2 py-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900/90 rounded-xl border border-zinc-800 text-xs font-mono">
            <span className="text-amber-400 font-bold">TABLE:</span>
            <span className="text-white font-bold tracking-wider">{roomState.code}</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-zinc-900/90 rounded-xl border border-zinc-800 text-xs font-mono text-zinc-400">
            <span>Hand #{gameState.handNumber}</span>
            <span>•</span>
            <span>Blinds {formatRupee(roomState.config.smallBlind)}/{formatRupee(roomState.config.bigBlind)}</span>
          </div>
        </div>

        {/* Responsible Disclaimer Pill */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-zinc-900/60 rounded-full border border-zinc-800 text-[10px] text-zinc-400 font-mono">
          <Shield className="w-3 h-3 text-amber-400 shrink-0" />
          <span>{VIRTUAL_CURRENCY_DISCLAIMER}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="p-2 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 rounded-xl border border-zinc-800 transition"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>

          {/* History */}
          <button
            onClick={() => setShowHistory(true)}
            className="p-2 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 rounded-xl border border-zinc-800 transition"
            title="Hand History"
          >
            <History className="w-4 h-4 text-amber-400" />
          </button>

          {/* Leave */}
          <button
            onClick={onLeaveRoom}
            className="p-2 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 rounded-xl border border-zinc-800 transition"
            title="Leave Room"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center Table Arena */}
      <div className="relative w-full max-w-5xl flex-1 max-h-[72vh] my-auto flex items-center justify-center">
        {/* Leather Rail Wrapper */}
        <div className="relative w-full h-full max-w-4xl max-h-[530px] poker-table-outer-rail flex items-center justify-center">
          {/* Woven Felt Surface with Racetrack */}
          <div className="w-full h-full poker-felt-surface flex flex-col items-center justify-center p-4">
            {/* Racetrack betting line */}
            <div className="poker-betting-line"></div>

            {/* Table Felt Center Emblem */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
              <span className="font-serif text-6xl sm:text-8xl text-amber-200 font-black tracking-widest">
                ROYAL CLUB
              </span>
            </div>

            {/* Pot Display */}
            <div className="flex flex-col items-center z-20 mb-3">
              <div className="flex items-center gap-2 bg-black/75 backdrop-blur-md px-4 py-1.5 rounded-full border border-amber-500/40 shadow-xl">
                <span className="text-[11px] uppercase tracking-wider text-amber-400 font-mono font-bold">
                  POT:
                </span>
                <span className="text-sm sm:text-base font-black text-amber-200 font-mono">
                  {formatRupee(gameState.pot)}
                </span>
              </div>

              {/* Side Pots if any */}
              {gameState.sidePots && gameState.sidePots.length > 1 && (
                <div className="flex items-center gap-2 mt-1">
                  {gameState.sidePots.map((sp, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-black/80 border border-zinc-700 text-amber-300 shadow-sm"
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

            {/* Street / Phase Badge */}
            <div className="mt-3 px-3 py-0.5 bg-black/60 rounded-full border border-emerald-500/30 text-[10px] font-mono uppercase tracking-widest text-emerald-400">
              {gameState.phase}
            </div>

            {/* Render Seated Players around the table */}
            {gameState.players.map((player) => (
              <div
                key={player.id}
                style={getSeatPositionClass(player.seatIndex)}
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

      {/* Bottom Area: Your Hole Cards & Action Bar */}
      <div className="w-full max-w-2xl flex flex-col items-center gap-2 z-30 pb-2">
        {/* Your Hole Cards */}
        {me && me.holeCards && me.holeCards.length > 0 && !me.hasFolded && (
          <div className="flex items-center gap-2.5 transform -translate-y-2 hover:-translate-y-3 transition-transform">
            {me.holeCards.map((c, idx) => (
              <CardView key={idx} card={c} size="lg" />
            ))}
          </div>
        )}

        {/* Action Bar */}
        <ActionBar
          isMyTurn={isMyTurn}
          legalActions={gameState.legalActions}
          pot={gameState.pot}
          currentBet={gameState.currentBet}
          myChips={me?.chips ?? 0}
          onAction={onAction}
        />
      </div>

      {/* Showdown Banner on Hand Finish */}
      {gameState.lastHandResult && gameState.phase === 'HAND_COMPLETE' && (
        <ShowdownBanner
          result={gameState.lastHandResult}
          players={gameState.players}
          myPlayerId={myPlayerId}
        />
      )}

      {/* Hand History Modal */}
      {showHistory && (
        <HandHistoryModal
          roomCode={roomState.code}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
};
