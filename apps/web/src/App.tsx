import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useSocket } from './hooks/useSocket.js';
import { useVoiceChat } from './hooks/useVoiceChat.js';
import { LandingPage } from './pages/LandingPage.js';
import { WifiOff, AlertCircle } from 'lucide-react';
import type { RoomConfig } from '@poker/shared';

// Lazy-load non-landing views for lightning-fast FCP / initial bundle
const CreateRoomModal = lazy(() =>
  import('./components/CreateRoomModal.js').then((m) => ({ default: m.CreateRoomModal }))
);
const JoinTableModal = lazy(() =>
  import('./components/JoinTableModal.js').then((m) => ({ default: m.JoinTableModal }))
);
const LobbyView = lazy(() =>
  import('./components/LobbyView.js').then((m) => ({ default: m.LobbyView }))
);
const PokerTable = lazy(() =>
  import('./components/PokerTable.js').then((m) => ({ default: m.PokerTable }))
);
const ChatAndReactions = lazy(() =>
  import('./components/ChatAndReactions.js').then((m) => ({ default: m.ChatAndReactions }))
);

export function App() {
  const {
    isConnected,
    playerId,
    playerName,
    roomState,
    gameState,
    chatMessages,
    floatingReactions,
    errorNotification,
    createRoom,
    quickPlayBots,
    joinRoom,
    leaveRoom,
    toggleReady,
    startGame,
    sendAction,
    sendChat,
    sendReaction,
    rebuyChips,
    readyForNextHand,
    dealNextHand,
    updateRoomConfig,
    tableAlerts,
    addBot,
    removeBot,
    fillBots,
    clearBots,
    socket,
  } = useSocket();

  // WebRTC Voice Chat Hook
  const {
    isVoiceActive,
    isMuted,
    isSpeaking,
    speakingPeers,
    toggleMute,
    micError,
  } = useVoiceChat(socket, roomState?.code, playerId);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [initialRoomCode, setInitialRoomCode] = useState<string>('');

  // Extract invite code from pathname /room/:code
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/room\/([A-Za-z0-9]+)/);
    if (match) {
      setInitialRoomCode(match[1].toUpperCase());
    }
  }, []);

  const handleCreateRoom = (name: string, config: RoomConfig, buyIn?: number) => {
    setShowCreateModal(false);
    createRoom(name, config, undefined, buyIn);
  };

  const handleJoinRoom = (code: string, name: string, buyIn?: number) => {
    setShowJoinModal(false);
    joinRoom(code, name, undefined, buyIn);
  };

  return (
    <div className="relative w-full min-h-dvh bg-[#07090e] text-zinc-100 font-sans">
      {/* Reconnection banner if disconnected */}
      {!isConnected && (
        <div className="fixed top-0 inset-x-0 z-50 bg-rose-600/90 text-white text-xs font-mono py-1 px-4 flex items-center justify-center gap-2 backdrop-blur-md shadow-lg">
          <WifiOff className="w-3.5 h-3.5 animate-pulse" />
          <span>Connecting to game server...</span>
        </div>
      )}

      {/* HTTPS Notice for LAN Devices (MacBook / Phones) */}
      {typeof window !== 'undefined' &&
        window.isSecureContext === false &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1' && (
          <div className="fixed top-0 inset-x-0 z-50 bg-amber-500 text-zinc-950 text-xs font-bold py-1.5 px-4 flex items-center justify-center gap-2 shadow-lg">
            <AlertCircle className="w-4 h-4 text-zinc-950 shrink-0" />
            <span>Microphone requires HTTPS on network devices (Mac/iPhone/Android).</span>
            <button
              onClick={() => {
                window.location.href = `https://${window.location.hostname}:${window.location.port || 5173}${window.location.pathname}${window.location.search}`;
              }}
              className="ml-2 px-2.5 py-0.5 bg-zinc-950 text-amber-400 hover:text-amber-200 rounded text-[11px] font-mono font-bold transition"
            >
              Switch to HTTPS
            </button>
          </div>
        )}

      {/* Global Error Notification Toast */}
      {(errorNotification || micError) && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-rose-950/95 border border-rose-500 text-rose-200 text-xs font-semibold py-2 px-4 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorNotification || micError}</span>
        </div>
      )}

      {/* 1. Landing Page (when not inside a room) */}
      {!roomState && (
        <LandingPage
          initialRoomCode={initialRoomCode}
          playerName={playerName}
          onQuickPlayBots={(botCount, difficulty) => quickPlayBots(undefined, botCount, difficulty)}
          onOpenCreate={() => setShowCreateModal(true)}
          onOpenJoin={() => setShowJoinModal(true)}
          onJoinRoom={handleJoinRoom}
        />
      )}

      {/* 2. Lobby View (when in room, before game start) */}
      {roomState && (!gameState || gameState.phase === 'WAITING_FOR_PLAYERS') && (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#07090e] text-amber-400 font-mono text-xs">Loading lobby...</div>}>
          <LobbyView
            roomState={roomState}
            myPlayerId={playerId}
            isVoiceActive={isVoiceActive}
            isMuted={isMuted}
            speakingPeers={speakingPeers}
            onToggleMute={toggleMute}
            onToggleReady={toggleReady}
            onStartGame={startGame}
            onLeaveRoom={leaveRoom}
            onAddBot={addBot}
            onRemoveBot={removeBot}
            onFillBots={fillBots}
            onClearBots={clearBots}
          />
        </Suspense>
      )}

      {/* 3. Live Poker Table (when game is active) */}
      {roomState && gameState && gameState.phase !== 'WAITING_FOR_PLAYERS' && (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#07090e] text-amber-400 font-mono text-xs">Loading table...</div>}>
          <PokerTable
            roomState={roomState}
            gameState={gameState}
            myPlayerId={playerId}
            isVoiceActive={isVoiceActive}
            isMuted={isMuted}
            speakingPeers={speakingPeers}
            tableAlerts={tableAlerts}
            onToggleMute={toggleMute}
            onAction={sendAction}
            onLeaveRoom={leaveRoom}
            onOpenChat={() => setIsChatOpen(true)}
            onRebuyChips={rebuyChips}
            onReadyForNextHand={readyForNextHand}
            onDealNextHand={dealNextHand}
            onUpdateConfig={updateRoomConfig}
            unreadChatCount={chatMessages.length}
            onAddBot={addBot}
            onRemoveBot={removeBot}
            onFillBots={fillBots}
            onClearBots={clearBots}
          />
        </Suspense>
      )}

      {/* Table Chat & Quick Reactions (Slide-over drawer - zero table obstruction) */}
      {roomState && (
        <Suspense fallback={null}>
          <ChatAndReactions
            messages={chatMessages}
            reactions={floatingReactions}
            onSendMessage={sendChat}
            onSendReaction={sendReaction}
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
          />
        </Suspense>
      )}

      {/* Create Table Modal */}
      {showCreateModal && (
        <Suspense fallback={null}>
          <CreateRoomModal
            initialName={playerName}
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateRoom}
          />
        </Suspense>
      )}

      {/* Join Table Modal */}
      {showJoinModal && (
        <Suspense fallback={null}>
          <JoinTableModal
            initialCode={initialRoomCode}
            onClose={() => setShowJoinModal(false)}
            onJoin={handleJoinRoom}
          />
        </Suspense>
      )}
    </div>
  );
}
