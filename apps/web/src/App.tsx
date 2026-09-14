import React, { useState, useEffect } from 'react';
import { useSocket } from './hooks/useSocket.js';
import { LandingPage } from './pages/LandingPage.js';
import { CreateRoomModal } from './components/CreateRoomModal.js';
import { LobbyView } from './components/LobbyView.js';
import { PokerTable } from './components/PokerTable.js';
import { ChatAndReactions } from './components/ChatAndReactions.js';
import { WifiOff, AlertCircle } from 'lucide-react';
import type { RoomConfig } from '@poker/shared';

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
    joinRoom,
    leaveRoom,
    toggleReady,
    startGame,
    sendAction,
    sendChat,
    sendReaction,
  } = useSocket();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [initialRoomCode, setInitialRoomCode] = useState<string>('');

  // Extract invite code from pathname /room/:code
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/room\/([A-Za-z0-9]+)/);
    if (match) {
      setInitialRoomCode(match[1].toUpperCase());
    }
  }, []);

  const handleCreateRoom = (name: string, config: RoomConfig) => {
    setShowCreateModal(false);
    createRoom(name, config);
  };

  const handleJoinRoom = (code: string, name: string) => {
    joinRoom(code, name);
  };

  return (
    <div className="relative min-h-screen bg-[#07090e] text-zinc-100 font-sans">
      {/* Reconnection banner if disconnected */}
      {!isConnected && (
        <div className="fixed top-0 inset-x-0 z-50 bg-rose-600/90 text-white text-xs font-mono py-1 px-4 flex items-center justify-center gap-2 backdrop-blur-md shadow-lg">
          <WifiOff className="w-3.5 h-3.5 animate-pulse" />
          <span>Connecting to game server...</span>
        </div>
      )}

      {/* Global Error Notification Toast */}
      {errorNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-rose-950/95 border border-rose-500 text-rose-200 text-xs font-semibold py-2.5 px-5 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{errorNotification}</span>
        </div>
      )}

      {/* 1. Landing Page (when not inside a room) */}
      {!roomState && (
        <LandingPage
          initialRoomCode={initialRoomCode}
          onOpenCreate={() => setShowCreateModal(true)}
          onJoinRoom={handleJoinRoom}
        />
      )}

      {/* 2. Lobby View (when in room, before game start) */}
      {roomState && (!gameState || gameState.phase === 'WAITING_FOR_PLAYERS') && (
        <LobbyView
          roomState={roomState}
          myPlayerId={playerId}
          onToggleReady={toggleReady}
          onStartGame={startGame}
          onLeaveRoom={leaveRoom}
        />
      )}

      {/* 3. Live Poker Table (when game is active) */}
      {roomState && gameState && gameState.phase !== 'WAITING_FOR_PLAYERS' && (
        <PokerTable
          roomState={roomState}
          gameState={gameState}
          myPlayerId={playerId}
          onAction={sendAction}
          onLeaveRoom={leaveRoom}
        />
      )}

      {/* Chat & Floating Reactions (when in any room) */}
      {roomState && (
        <ChatAndReactions
          messages={chatMessages}
          reactions={floatingReactions}
          onSendMessage={sendChat}
          onSendReaction={sendReaction}
        />
      )}

      {/* Create Room Modal */}
      {showCreateModal && (
        <CreateRoomModal
          initialName={playerName}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateRoom}
        />
      )}
    </div>
  );
}
