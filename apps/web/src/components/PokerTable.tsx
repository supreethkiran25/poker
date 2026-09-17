import React, { useState, useEffect } from 'react';
import type {
  GamePublicState,
  RoomPublicState,
  ActionType,
  RoomConfig,
  BotPersonality,
  BotDifficulty,
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
import { MobileTableMenu } from './MobileTableMenu.js';
import { ChipStack } from './ChipStack.js';
import { AddBotModal } from './AddBotModal.js';
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
  Copy,
  Share2,
  Menu,
  Bot,
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
  onUpdateConfig?: (config: Partial<RoomConfig>) => void;
  unreadChatCount?: number;
  onAddBot?: (personality?: BotPersonality, name?: string, difficulty?: BotDifficulty) => void;
  onRemoveBot?: (botPlayerId: string) => void;
  onFillBots?: (targetCount?: number, difficulty?: BotDifficulty | 'mixed') => void;
  onClearBots?: () => void;
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
  onUpdateConfig,
  unreadChatCount = 0,
  onAddBot,
  onRemoveBot,
  onFillBots,
  onClearBots,
}) => {
  const [showSummary, setShowSummary] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRebuy, setShowRebuy] = useState(false);
  const [showShowdown, setShowShowdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAddBotModal, setShowAddBotModal] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [layoutMode, setLayoutMode] = useState<'mobile' | 'tablet' | 'mobile-landscape' | 'desktop'>(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const h = typeof window !== 'undefined' ? window.innerHeight : 800;
    const ratio = w / h;
    if (ratio < 1.28) {
      return w < 640 ? 'mobile' : 'tablet';
    }
    if (h <= 520) {
      return 'mobile-landscape';
    }
    return 'desktop';
  });

  const isPortrait = layoutMode === 'mobile' || layoutMode === 'tablet';
  const isTablet = layoutMode === 'tablet';
  const isMobilePortrait = layoutMode === 'mobile';
  const isMobileLandscape = layoutMode === 'mobile-landscape';

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  const handleCopyRoomCode = () => {
    const url = `${window.location.origin}/room/${roomState.code}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    setCopiedCode(true);
    setCopiedToast(true);
    setTimeout(() => setCopiedCode(false), 2500);
    setTimeout(() => setCopiedToast(false), 3000);
  };

  const handleShareInvite = async () => {
    const url = `${window.location.origin}/room/${roomState.code}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join my private Poker Table: ${roomState.code}`,
          text: `Play Texas Hold'em with me on PokerCircle! Room code: ${roomState.code}`,
          url,
        });
      } catch (err) {}
    } else {
      handleCopyRoomCode();
    }
  };

  useEffect(() => {
    if (gameState.phase === 'HAND_COMPLETE') {
      setShowShowdown(false);
    }
  }, [gameState.phase, gameState.handNumber]);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const ratio = w / h;
      if (ratio < 1.28) {
        setLayoutMode(w < 640 ? 'mobile' : 'tablet');
      } else if (h <= 520) {
        setLayoutMode('mobile-landscape');
      } else {
        setLayoutMode('desktop');
      }
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const me = gameState.players.find((p) => p.id === myPlayerId);
  const isMyTurn = me?.isTurn ?? false;
  const opponents = gameState.players.filter((p) => p.id !== myPlayerId);
  const isHost = me?.isHost ?? false;

  const nextHandReadyList = roomState.nextHandReadyPlayerIds || [];
  const amIReadyForNext = nextHandReadyList.includes(myPlayerId);

  const isHandComplete = gameState.phase === 'HAND_COMPLETE';
  const lastResult = gameState.lastHandResult;
  const winners = lastResult?.winners || [];
  const primaryWinner = winners[0];
  const winnerPlayer = gameState.players.find((p) => p.id === primaryWinner?.playerId);
  const isMeWinner = winners.some((w) => w.playerId === myPlayerId);
  const winnerPlayerIds = winners.map((w) => w.playerId);
  const winningCards = primaryWinner?.winningCards || [];
  const totalWonPot = winners.reduce((sum, w) => sum + (w.amount || 0), 0) || gameState.pot;
  const isSplitPot = winners.length > 1;

  // Best clean hand rank text for badge (e.g. "Full House")
  const winningRankBadgeText = React.useMemo(() => {
    if (!primaryWinner) return null;
    if (
      primaryWinner.handRank &&
      primaryWinner.handRank !== 'Winner' &&
      primaryWinner.handRank !== 'Default' &&
      primaryWinner.handRank !== 'Opponents Folded'
    ) {
      return primaryWinner.handRank;
    }
    if (primaryWinner.handName) {
      const parts = primaryWinner.handName.split(',');
      return parts[0].trim();
    }
    return 'Winner';
  }, [primaryWinner]);

  // Showdown hole cards for revealed hands
  const showdownCardsMap = React.useMemo(() => {
    const map: Record<string, any[]> = {};
    if (lastResult?.showdownHands) {
      for (const sh of lastResult.showdownHands) {
        map[sh.playerId] = sh.cards;
      }
    }
    if (lastResult?.winners) {
      for (const w of lastResult.winners) {
        if (w.holeCards && w.holeCards.length > 0) {
          map[w.playerId] = w.holeCards;
        }
      }
    }
    return map;
  }, [lastResult]);

  const [nextHandCountdown, setNextHandCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (gameState.phase === 'HAND_COMPLETE') {
      setNextHandCountdown(7);
      const interval = setInterval(() => {
        setNextHandCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setNextHandCountdown(null);
    }
  }, [gameState.phase, gameState.handNumber]);

  const handleContinueClick = () => {
    if (isHost && onDealNextHand) {
      onDealNextHand();
    } else if (onReadyForNextHand) {
      onReadyForNextHand(!amIReadyForNext);
    }
    setShowShowdown(false);
  };

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

    const rx = isPortrait ? (isTablet ? 42 : 39) : (isMobileLandscape ? 44 : 44);
    const ry = isPortrait ? (isTablet ? 42 : 38) : (isMobileLandscape ? 36 : 38);
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
    <div
      className="relative flex flex-col w-full h-dvh bg-[#06080d] text-zinc-100 select-none overflow-hidden"
      style={{
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      {/* ── Table Alert Banner (Leave, Disconnect, Rebuy alerts) ── */}
      <TableAlertBanner alerts={tableAlerts} />

      {/* ══ TOP NAVIGATION & STATUS BAR (Screen 5 & 6 Reference) ══ */}
      <header
        className={`flex-shrink-0 flex items-center justify-between px-3 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md z-30 transition-all ${
          isMobileLandscape ? 'py-1 min-h-[36px]' : 'py-2 min-h-[48px]'
        }`}
      >
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

          {/* Always-visible Clickable Room Code & Invite Pill */}
          <button
            onClick={handleShareInvite}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-amber-500/15 via-amber-600/10 to-transparent hover:from-amber-500/25 hover:to-amber-600/20 active:scale-95 rounded-lg border border-amber-500/40 text-[11px] font-mono text-amber-300 transition flex-shrink-0 shadow-sm"
            title="Click to copy invite link / share room code"
          >
            <span className="text-amber-400 font-bold">♠</span>
            <span className="font-bold tracking-wider">{roomState.code}</span>
            {copiedCode ? (
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
            )}
            <span className="text-[10px] font-sans font-semibold text-amber-300 hidden sm:inline">
              {copiedCode ? 'Copied!' : 'Invite'}
            </span>
          </button>

          <span className="text-zinc-600 hidden md:inline">•</span>
          <span className="text-[11px] font-mono text-zinc-400 hidden md:inline">
            {formatRupee(roomState.config.smallBlind)}/{formatRupee(roomState.config.bigBlind)} Blinds
          </span>
        </div>

        {/* Right Desktop Toolbar (hidden on mobile phone portrait & landscape) */}
        <div className={`${isMobileLandscape ? 'hidden' : 'hidden sm:flex'} items-center gap-1.5 flex-shrink-0`}>
          {/* Mid-Game Invite Friends Button */}
          <button
            onClick={handleShareInvite}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 text-amber-400 hover:text-amber-300 rounded-xl border border-zinc-800 hover:border-amber-500/40 transition flex items-center gap-1 text-xs font-mono font-bold"
            title="Invite Friends to Table"
          >
            {copiedCode ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Share2 className="w-4 h-4 text-amber-400" />
            )}
            <span className="hidden md:inline">{copiedCode ? 'COPIED' : 'INVITE'}</span>
          </button>

          {/* Quick Rebuy Button */}
          <button
            onClick={() => setShowRebuy(true)}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 text-amber-400 rounded-xl border border-amber-500/30 transition flex items-center gap-1 text-xs font-mono font-bold"
            title="Rebuy Chips"
          >
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">REBUY</span>
          </button>

          {/* Add Bots Button */}
          <button
            onClick={() => setShowAddBotModal(true)}
            className="p-2 bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 hover:text-purple-200 rounded-xl border border-purple-500/40 transition flex items-center gap-1.5 text-xs font-mono font-bold"
            title="Add AI Bots"
          >
            <Bot className="w-4 h-4 text-purple-400" />
            <span className="hidden md:inline">BOTS</span>
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
            className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl border border-zinc-800 transition"
            title="Session Summary"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
          </button>

          {/* Hand History */}
          <button
            onClick={() => setShowHistory(true)}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl border border-zinc-800 transition flex items-center"
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

        {/* Right Mobile Toolbar (Clean, Uncluttered: Mic, Chat, Menu) */}
        <div className={`${isMobileLandscape ? 'flex' : 'flex sm:hidden'} items-center gap-1.5 flex-shrink-0`}>
          {/* Quick Voice Mic */}
          {onToggleMute && (
            <button
              onClick={onToggleMute}
              className={`p-2 rounded-xl border transition flex items-center ${
                isVoiceActive && !isMuted
                  ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 ring-2 ring-emerald-500/30'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
              title={isVoiceActive && !isMuted ? 'Mute Mic' : 'Turn on Mic'}
            >
              {isVoiceActive && !isMuted ? (
                <Mic className="w-4 h-4 text-emerald-400 animate-pulse" />
              ) : (
                <MicOff className="w-4 h-4 text-rose-400" />
              )}
            </button>
          )}

          {/* Chat with Unread Badge */}
          <button
            onClick={onOpenChat}
            className="p-2 bg-zinc-900 text-zinc-300 rounded-xl border border-zinc-800 transition relative active:scale-95"
            title="Chat"
          >
            <MessageSquare className="w-4 h-4 text-amber-400" />
            {unreadChatCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-zinc-950" />
            )}
          </button>

          {/* Sleek Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(true)}
            className="px-2.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-amber-300 rounded-xl border border-amber-500/40 transition active:scale-95 flex items-center gap-1.5 shadow-sm"
            title="Table Menu"
          >
            <Menu className="w-4 h-4 text-amber-400" />
            <span className="text-[11px] font-bold text-amber-300 font-mono">Menu</span>
          </button>
        </div>
      </header>

      {/* ══ TABLE ARENA (Portrait Oval on Mobile, Landscape on Desktop) ══ */}
      <main className="flex-1 flex items-center justify-center p-2 min-h-0 relative poker-arena-bg">
        <div
          className="poker-table-outer-rail relative transition-all duration-300"
          style={
            isPortrait
              ? isTablet
                ? {
                    width: 'min(92vw, 680px)',
                    height: 'min(70vh, 760px)',
                    maxHeight: 'calc(100dvh - 180px)',
                    borderRadius: '190px',
                  }
                : {
                    width: 'min(96vw, 440px)',
                    height: 'calc(100dvh - 175px)',
                    maxHeight: '620px',
                    borderRadius: '140px',
                  }
              : isMobileLandscape
              ? {
                  width: 'min(98vw, calc((100dvh - 84px) * 2.15))',
                  maxHeight: 'calc(100dvh - 84px)',
                  aspectRatio: '2.15 / 1',
                  borderRadius: '9999px',
                }
              : {
                  width: '100%',
                  aspectRatio: '1.82 / 1',
                  maxWidth: 'min(98vw, calc((100dvh - 130px) * 1.82))',
                  maxHeight: 'calc(100dvh - 130px)',
                  borderRadius: '9999px',
                }
          }
        >
          {/* Inner Teal Felt Surface */}
          <div
            className="poker-felt-surface w-full h-full relative"
            style={{
              borderRadius: isPortrait ? (isTablet ? '175px' : '126px') : '9999px',
            }}
          >
            {/* Racetrack betting line */}
            <div
              className="poker-betting-line"
              style={{
                borderRadius: isPortrait ? (isTablet ? '160px' : '110px') : '9999px',
              }}
            />

            {/* PokerCircle Watermark in Center */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.04]">
              <span className="font-serif text-amber-100 font-black tracking-[0.25em] text-2xl sm:text-4xl md:text-5xl whitespace-nowrap">
                POKER CIRCLE
              </span>
            </div>

            {/* ── Opponents Positioned on Oval Perimeter ── */}
            {opponents.map((player) => {
              const oppStyle = getOpponentStyle(player.seatIndex);
              const isTopHalf = parseFloat(String(oppStyle.top)) < 45;
              return (
                <div key={player.id} style={oppStyle}>
                  <PlayerSeat
                    player={player}
                    isMe={false}
                    dealerSeat={gameState.dealerSeat}
                    smallBlindSeat={gameState.smallBlindSeat}
                    bigBlindSeat={gameState.bigBlindSeat}
                    turnExpiresAt={player.isTurn ? gameState.turnExpiresAt : null}
                    turnDuration={gameState.turnDuration}
                    compact={true}
                    chipPlacement={isTopHalf ? 'bottom' : 'top'}
                    isSpeaking={!!speakingPeers[player.id]}
                    isWinner={winnerPlayerIds.includes(player.id)}
                    winningCards={winningCards}
                    showdownHoleCards={showdownCardsMap[player.id]}
                    isHandComplete={isHandComplete}
                    onKickBot={(botId) => onRemoveBot && onRemoveBot(botId)}
                    isHost={isHost}
                  />
                </div>
              );
            })}

            {/* ── Bored / Alone Callout when only 1 player at table ── */}
            {opponents.length === 0 && (
              <div
                className="absolute z-25 p-4 sm:p-5 rounded-3xl bg-zinc-950/95 border border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.25)] backdrop-blur-md flex flex-col items-center text-center max-w-xs sm:max-w-sm pointer-events-auto animate-scale-up"
                style={{
                  left: '50%',
                  top: isPortrait ? (isTablet ? '42%' : '44%') : '42%',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-xl mb-1.5 shadow-inner">
                  🤖
                </div>
                <div className="text-white font-black text-sm sm:text-base leading-tight">
                  Playing alone or bored?
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 mb-3.5 leading-relaxed">
                  Add smart AI bots with distinct personalities and keep Texas Hold'em rolling!
                </p>
                <div className="flex items-center gap-2 w-full">
                  <button
                    onClick={() => onAddBot && onAddBot()}
                    className="flex-1 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 active:scale-95 text-zinc-950 font-black text-xs rounded-xl shadow transition"
                  >
                    + Add 1 Bot
                  </button>
                  <button
                    onClick={() => setShowAddBotModal(true)}
                    className="flex-1 py-2 bg-purple-900/60 hover:bg-purple-800 text-purple-200 font-bold text-xs rounded-xl border border-purple-500/40 active:scale-95 transition"
                  >
                    Choose Bots
                  </button>
                </div>
              </div>
            )}

            {/* ── Table Center: Community Cards + Showdown Results (or Pot during active play) ── */}
            <div
              className="absolute z-20 flex flex-col items-center gap-1.5 sm:gap-2 pointer-events-auto"
              style={{
                left: '50%',
                top: isPortrait ? (isTablet ? '38%' : '42%') : '38%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* When Hand Complete: Sleek Unified Showdown Pill (Winner + Pot + Hand Rank) */}
              {isHandComplete ? (
                <div className="flex items-center gap-1.5 animate-fade-in z-30 mb-1">
                  <div className="bg-black/90 text-white px-4 sm:px-6 py-1.5 rounded-full shadow-2xl border border-amber-400/70 flex items-center gap-2 backdrop-blur-md select-none">
                    <span className="text-xs sm:text-sm font-bold text-zinc-300">
                      {isSplitPot
                        ? `${winners.map((w) => w.playerName).join(' & ')} split`
                        : `${winnerPlayer?.name || 'Player'} wins`}
                    </span>
                    <span className="text-xs sm:text-sm font-black text-amber-300 font-mono">
                      {formatRupee(totalWonPot)} pot
                    </span>
                    {winningRankBadgeText && (
                      <>
                        <span className="text-zinc-600">|</span>
                        <span className="text-xs sm:text-sm font-black text-amber-400 uppercase tracking-wide">
                          {winningRankBadgeText}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* Pot Badge during active play (Integrated with Phase on mobile to save vertical space) */}
                  <div className="flex items-center gap-1.5 bg-black/85 backdrop-blur-md px-3.5 py-1 rounded-full border border-amber-500/40 shadow-xl pointer-events-auto">
                    <span className="text-[10px] sm:text-xs uppercase tracking-widest text-amber-400 font-mono font-black">
                      POT
                    </span>
                    <span className="text-[10px] text-amber-500/60 font-mono">|</span>
                    <span className="text-xs sm:text-sm font-black text-amber-200 font-mono">
                      {formatRupee(gameState.pot)}
                    </span>
                    {/* On mobile phone view, integrate phase directly into the pot badge */}
                    {isPortrait && !isTablet && !isHandComplete && gameState.phase !== 'WAITING_FOR_PLAYERS' && gameState.phase !== 'STARTING' && (
                      <>
                        <span className="text-[10px] text-emerald-500/60 font-mono">•</span>
                        <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                          {gameState.phase.replace(/_/g, ' ')}
                        </span>
                      </>
                    )}
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
                </>
              )}

              {/* 5 Community Cards */}
              <CommunityCards
                cards={gameState.communityCards}
                phase={gameState.phase}
                winningCards={winningCards}
                compact={isPortrait ? !isTablet : isMobileLandscape}
              />

              {/* Phase Badge during active play (Desktop & Tablet only, on phone it's inside Pot badge) */}
              {(!isPortrait || isTablet) && !isMobileLandscape && !isHandComplete && gameState.phase !== 'WAITING_FOR_PLAYERS' && gameState.phase !== 'STARTING' && (
                <div className="px-2.5 py-0.5 bg-black/70 rounded-full border border-emerald-500/40 text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold shadow">
                  {gameState.phase.replace(/_/g, ' ')}
                </div>
              )}
            </div>

            {/* ── Hero Active Bet Chip in Dedicated Betting Zone (Mobile Phone Portrait) ── */}
            {me && me.currentBet > 0 && !isHandComplete && isPortrait && (
              <div
                className="absolute z-22 pointer-events-auto animate-fade-in"
                style={{
                  left: '50%',
                  top: isTablet ? '56%' : '61%',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <ChipStack amount={me.currentBet} size="sm" />
              </div>
            )}

            {/* ── Player's Hole Cards on the Felt (Positioned cleanly below community board) ── */}
            {me && me.holeCards && me.holeCards.length > 0 && (
              <div
                className={`absolute z-20 flex items-center -space-x-1 sm:space-x-1 pointer-events-auto transition-all duration-300 ${
                  me.hasFolded ? 'opacity-40 grayscale-[60%] scale-90' : 'opacity-100'
                }`}
                style={{
                  left: '50%',
                  top: isPortrait ? (isTablet ? '72%' : '76%') : (isMobileLandscape ? '73%' : '74%'),
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {me.holeCards.map((c, idx) => {
                  const isWinning =
                    isMeWinner &&
                    !('hidden' in c) &&
                    winningCards.some((wc) => wc.suit === c.suit && wc.rank === c.rank);
                  const isDim = isHandComplete && !isWinning;
                  return (
                    <CardView
                      key={idx}
                      card={c}
                      size={isTablet || (!isPortrait && !isMobileLandscape) ? 'lg' : 'md'}
                      dealDelayMs={idx * 140}
                      isInteractive={!me.hasFolded}
                      isHighlighted={isWinning}
                      isDimmed={isDim}
                      tiltDeg={idx === 0 ? -3 : 3}
                    />
                  );
                })}
                {me.hasFolded && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 px-2 py-0.5 rounded-full bg-zinc-950/90 border border-zinc-700 text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest pointer-events-none whitespace-nowrap shadow-md">
                    Folded
                  </div>
                )}
              </div>
            )}

            {/* ── "YOU" Seat Pod at Bottom Center of Oval Rail ── */}
            {me && (
              <div
                className="absolute z-25 pointer-events-auto"
                style={{
                  left: '50%',
                  top: isPortrait ? (isTablet ? '89%' : '89%') : (isMobileLandscape ? '87%' : '87%'),
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
                  chipPlacement={isPortrait ? 'none' : 'top'}
                  isSpeaking={isVoiceActive && !isMuted}
                  isWinner={isMeWinner}
                  winningCards={winningCards}
                  showdownHoleCards={me.holeCards}
                  isHandComplete={isHandComplete}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ══ BOTTOM ACTION ZONE (Pinned cleanly with safe-area spacing) ══ */}
      <footer
        className={`flex-shrink-0 flex flex-col items-center z-30 px-2.5 ${
          isMobileLandscape ? 'pb-1 pt-0.5' : 'pb-2'
        }`}
        style={{ paddingBottom: 'max(6px, env(safe-area-inset-bottom, 6px))' }}
      >
        <div className="w-full max-w-xl">
          {/* Phase: Hand Complete - Next Hand Auto-Continue / Controls */}
          {gameState.phase === 'HAND_COMPLETE' ? (
            <div
              className={`w-full bg-zinc-950/95 backdrop-blur-xl border border-amber-500/40 shadow-2xl flex flex-col sm:flex-row items-center justify-between animate-fade-in ${
                isMobileLandscape ? 'p-1.5 gap-1.5 rounded-xl' : 'p-3 gap-3 rounded-2xl'
              }`}
            >
              <div className="text-left">
                <div className={`font-bold text-amber-300 ${isMobileLandscape ? 'text-[11px]' : 'text-xs'}`}>
                  Hand #{gameState.handNumber} Complete
                </div>
                {!isMobileLandscape && (
                  <div className="text-[10px] text-zinc-400 font-mono">
                    {gameState.players.some((p) => p.chips === 0)
                      ? 'Waiting for players to rebuy chips…'
                      : 'Next hand ready…'}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* View Hand Recap button if dismissed */}
                {!showShowdown && (
                  <button
                    onClick={() => setShowShowdown(true)}
                    className={`flex-1 sm:flex-none bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-500/40 font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                      isMobileLandscape ? 'px-2 py-1.5 text-[11px]' : 'px-3 py-2 text-xs'
                    }`}
                  >
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>Recap</span>
                  </button>
                )}

                {/* Immediate Deal / Ready Button */}
                <button
                  onClick={handleContinueClick}
                  className={`flex-1 sm:flex-none rounded-xl font-black uppercase tracking-wider shadow-lg active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    isMobileLandscape ? 'px-3 py-1.5 text-[11px]' : 'px-5 py-2.5 text-xs'
                  } ${
                    !isHost && amIReadyForNext
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20'
                      : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-zinc-950 shadow-amber-500/20'
                  }`}
                >
                  {!isHost && amIReadyForNext ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4 fill-zinc-950" />
                  )}
                  <span>{isHost ? 'Deal Now' : amIReadyForNext ? 'Ready!' : 'Ready'}</span>
                  {nextHandCountdown !== null && nextHandCountdown > 0 && (
                    <span className="text-[10px] font-mono opacity-80 font-black">({nextHandCountdown}s)</span>
                  )}
                </button>
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
              compact={isMobileLandscape}
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
        onClose={() => setShowRebuy(false)}
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
          roomCode={roomState.code}
          isHost={isHost}
          currentTurnTimer={gameState.turnDuration}
          isVoiceActive={isVoiceActive}
          isMuted={isMuted}
          onToggleMute={onToggleMute || (() => {})}
          onUpdateConfig={onUpdateConfig}
          onOpenHistory={() => {
            setShowSettings(false);
            setShowHistory(true);
          }}
          onOpenRules={() => {
            setShowSettings(false);
            setShowRules(true);
          }}
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

      {/* ══ COPIED INVITE LINK TOAST ══ */}
      {copiedToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-amber-950/95 border border-amber-500/80 text-amber-200 text-xs font-semibold py-2 px-4 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Invite link copied! Share with friends to join room {roomState.code}.</span>
        </div>
      )}

      {/* ══ MOBILE TABLE DRAWER MENU (Screen 5 Clean Header Drawer) ══ */}
      <MobileTableMenu
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        roomCode={roomState.code}
        handNumber={gameState.handNumber}
        smallBlind={roomState.config.smallBlind}
        bigBlind={roomState.config.bigBlind}
        copiedCode={copiedCode}
        onShareInvite={handleShareInvite}
        onOpenRebuy={() => setShowRebuy(true)}
        onOpenHistory={() => setShowHistory(true)}
        onOpenRules={() => setShowRules(true)}
        onOpenSettings={() => setShowSettings(true)}
        onLeaveRoom={onLeaveRoom}
        onOpenAddBot={() => setShowAddBotModal(true)}
      />

      {/* ══ ADD BOT MODAL ══ */}
      {showAddBotModal && (
        <AddBotModal
          isOpen={showAddBotModal}
          onClose={() => setShowAddBotModal(false)}
          roomState={roomState}
          isHandInProgress={gameState.phase !== 'HAND_COMPLETE' && gameState.phase !== 'WAITING_FOR_PLAYERS'}
          onAddBot={(personality, name, difficulty) => onAddBot && onAddBot(personality, name, difficulty)}
          onFillBots={(count, difficulty) => onFillBots && onFillBots(count, difficulty)}
          onClearBots={() => onClearBots && onClearBots()}
          onRemoveBot={(botPlayerId) => onRemoveBot && onRemoveBot(botPlayerId)}
        />
      )}
    </div>
  );
};
