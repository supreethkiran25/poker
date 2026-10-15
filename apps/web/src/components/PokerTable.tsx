import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { PotCoinsVisual } from './PotCoinsVisual.js';
import { soundManager } from '../audio/sound-manager.js';
import { calculateHandEquity } from '../utils/handEquityCalculator.js';
import { ChipsFlyAnimation, type WinnerFlyTarget } from './ChipsFlyAnimation.js';
import {
  useAccountWallet,
  addAccountCoins,
  deductAccountCoins,
  setAccountCoins,
  getAccountCoins,
} from '../utils/accountWallet.js';
import { ZeroBalanceReloadModal } from './ZeroBalanceReloadModal.js';
import { GoldCoin3D } from './CasinoChip3D.js';
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
  Receipt,
  Lock,
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
  const [summaryMode, setSummaryMode] = useState<'IN_GAME' | 'LEAVING'>('IN_GAME');
  const [showHistory, setShowHistory] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRebuy, setShowRebuy] = useState(false);
  const [showZeroBalanceReload, setShowZeroBalanceReload] = useState(false);
  const [showShowdown, setShowShowdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAddBotModal, setShowAddBotModal] = useState(false);

  // References to synchronize account wallet on hand complete
  const prevHandChipsRef = React.useRef<number | null>(null);
  const prevHandNumberRef = React.useRef<number | null>(null);

  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [layoutMode, setLayoutMode] = useState<'mobile' | 'tablet' | 'mobile-landscape' | 'desktop'>(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const h = typeof window !== 'undefined' ? window.innerHeight : 800;
    const ratio = w / h;
    if (w < 600 || ratio < 1.05) {
      return w < 600 ? 'mobile' : 'tablet';
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
      if (w < 600 || ratio < 1.05) {
        setLayoutMode(w < 600 ? 'mobile' : 'tablet');
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

  // Account wallet balance
  const { coins: walletCoins } = useAccountWallet();

  // Local Player's won amount (for celebration payout)
  const myWonEntry = winners.find((w) => w.playerId === myPlayerId);
  const myWonAmount = myWonEntry ? (myWonEntry.amount || totalWonPot) : 0;

  // Real-time Win Percentage (Private: Only visible to local player on their device)
  const myWinEquity = React.useMemo(() => {
    if (!me?.holeCards || me.holeCards.length < 2 || me.hasFolded) return null;
    const activeCount = gameState.players.filter((p) => !p.hasFolded && p.chips >= 0).length;
    return calculateHandEquity(me.holeCards, gameState.communityCards, activeCount);
  }, [me?.holeCards, me?.hasFolded, gameState.communityCards, gameState.players]);


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

  // Check if hand is in progress and if player is eligible for rebuy
  const isHandInProgress =
    gameState.phase !== 'HAND_COMPLETE' &&
    gameState.phase !== 'WAITING_FOR_PLAYERS' &&
    gameState.phase !== 'STARTING';
  const canRebuy = (me?.chips ?? 0) <= 0 || !isHandInProgress;

  // Auto prompt rebuy if player has 0 chips
  useEffect(() => {
    if (me && me.chips === 0 && (gameState.phase === 'HAND_COMPLETE' || !isHandInProgress)) {
      setShowRebuy(true);
    }
  }, [me?.chips, gameState.phase, isHandInProgress]);

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
  // Determine if we’re in a crowded scenario
  const totalPlayerCount = gameState.players.length;
  const isCrowded = totalPlayerCount >= 6;

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

    // Widen oval radii when many players to spread them out more
    const rx = isPortrait
      ? (isTablet ? 42 : (isCrowded ? 43 : 40))
      : (isMobileLandscape ? 44 : 44);
    const ry = isPortrait
      ? (isTablet ? 42 : (isCrowded ? 40 : 38))
      : (isMobileLandscape ? 38 : 41);
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

  // ── Directional Winner Trajectories for 3D Flying Coins ──
  const winnerFlyTargets: WinnerFlyTarget[] = React.useMemo(() => {
    if (!isHandComplete || winners.length === 0) return [];
    return winners.map((w) => {
      const isMe = w.playerId === myPlayerId;
      if (isMe) {
        return {
          playerId: w.playerId,
          playerName: me?.name || 'You',
          isMe: true,
          xPercent: 50,
          yPercent: isPortrait ? 89 : 88,
          amount: w.amount || totalWonPot,
        };
      }
      const opp = opponents.find((p) => p.id === w.playerId);
      if (opp) {
        const style = getOpponentStyle(opp.seatIndex);
        const x = parseFloat(String(style.left)) || 50;
        const y = parseFloat(String(style.top)) || 15;
        return {
          playerId: w.playerId,
          playerName: opp.name,
          isMe: false,
          xPercent: x,
          yPercent: y,
          amount: w.amount || totalWonPot,
        };
      }
      return {
        playerId: w.playerId,
        playerName: 'Opponent',
        isMe: false,
        xPercent: 50,
        yPercent: 15,
        amount: w.amount || totalWonPot,
      };
    });
  }, [isHandComplete, winners, myPlayerId, isPortrait, me?.name, opponents, totalWonPot]);

  // ── Synchronize Account Wallet on Hand Complete (Net Wins / Net Losses) ──
  useEffect(() => {
    if (!me) return;

    // Initialize baseline stack on first mount or new hand
    if (prevHandChipsRef.current === null) {
      prevHandChipsRef.current = me.chips;
      prevHandNumberRef.current = gameState.handNumber;
      return;
    }

    if (gameState.phase === 'HAND_COMPLETE' && gameState.handNumber !== prevHandNumberRef.current) {
      prevHandNumberRef.current = gameState.handNumber;
      const previousChips = prevHandChipsRef.current;
      const currentChips = me.chips;
      const delta = currentChips - previousChips;

      if (delta > 0) {
        addAccountCoins(delta);
      } else if (delta < 0) {
        deductAccountCoins(Math.abs(delta));
      }

      prevHandChipsRef.current = currentChips;

      // Anti-loophole: Prompt for reload ONLY when BOTH table chips and account wallet hit 0
      const currentWallet = getAccountCoins();
      if (currentChips <= 0 && currentWallet <= 0) {
        setShowZeroBalanceReload(true);
      }
    } else if (gameState.phase !== 'HAND_COMPLETE') {
      if (prevHandNumberRef.current !== gameState.handNumber) {
        prevHandChipsRef.current = me.chips;
        prevHandNumberRef.current = gameState.handNumber;
      }
    }
  }, [gameState.phase, gameState.handNumber, me?.chips]);

  const handleRebuySubmit = (amount: number) => {
    setShowRebuy(false);
    // Table stakes rule: only block mid-hand top-up if player has > 0 chips and is actively participating
    if (isHandInProgress && (me?.chips ?? 0) > 0 && !me?.hasFolded) return;
    if (onRebuyChips && amount > 0) {
      // Deduct rebuy amount from account wallet
      deductAccountCoins(amount);
      if (prevHandChipsRef.current !== null) {
        prevHandChipsRef.current += amount;
      }
      soundManager.playCallChips(amount);
      onRebuyChips(amount);
    }
  };

  // Keep a fresh ref to the player's chip stack
  const meChipsRef = useRef<number>(me?.chips ?? 0);
  useEffect(() => {
    if (me && typeof me.chips === 'number') {
      meChipsRef.current = me.chips;
    }
  }, [me?.chips]);

  // When player exits from the table, save the exact chip count they had while leaving into the credit section
  const handleLeaveTable = useCallback(() => {
    const finalChips = typeof me?.chips === 'number' ? me.chips : meChipsRef.current;
    if (typeof finalChips === 'number') {
      setAccountCoins(finalChips);
    }
    onLeaveRoom();
  }, [me?.chips, onLeaveRoom]);

  // Also guarantee exact chips are saved to credit section on tab close, refresh, or component unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (typeof meChipsRef.current === 'number') {
        setAccountCoins(meChipsRef.current);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (typeof meChipsRef.current === 'number') {
        setAccountCoins(meChipsRef.current);
      }
    };
  }, []);


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
            onClick={() => {
              setSummaryMode('LEAVING');
              setShowSummary(true);
            }}
            className="flex items-center gap-1 text-xs font-mono font-bold text-zinc-300 hover:text-white transition p-1 hover:bg-zinc-900 rounded-lg"
            title="Leave Table & Settlement Slip"
          >
            <ChevronLeft className="w-4 h-4 text-amber-400" />
            <span>Hand #{gameState.handNumber}</span>
          </button>

          {/* Always-visible Clickable Room Code & Invite Pill */}
          <button
            onClick={handleShareInvite}
            className="flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-amber-500/15 via-amber-600/10 to-transparent hover:from-amber-500/25 hover:to-amber-600/20 active:scale-95 rounded-lg border border-amber-500/40 text-[11px] font-mono text-amber-300 transition flex-shrink-0 shadow-sm"
            title="Click to copy invite link / share room code"
          >
            <span className="text-[9px] font-mono uppercase font-black px-1 py-0.5 rounded bg-amber-500/20 text-amber-300">ROOM</span>
            <span className="font-bold tracking-wider text-amber-200">{roomState.code}</span>
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

          {/* Quick Rebuy Button - Strictly disabled mid-hand or when chips > 0 */}
          {canRebuy ? (
            <button
              onClick={() => setShowRebuy(true)}
              className="p-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl border border-amber-500/50 transition flex items-center gap-1.5 text-xs font-mono font-bold animate-pulse shadow-sm"
              title="Rebuy Chips (Busted - ₹0 chips)"
            >
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">REBUY</span>
            </button>
          ) : (
            <button
              disabled
              className="p-2 bg-zinc-900/60 text-zinc-600 rounded-xl border border-zinc-800/60 cursor-not-allowed flex items-center gap-1.5 text-xs font-mono"
              title={
                isHandInProgress
                  ? "Cannot rebuy while hand is in progress"
                  : "Rebuy only allowed when chips reach ₹0"
              }
            >
              <Lock className="w-3.5 h-3.5 text-zinc-600" />
              <span className="hidden sm:inline">REBUY</span>
            </button>
          )}

          {/* User Account Wallet Balance (Desktop) */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-amber-500/40 text-amber-300 shadow-sm"
            title="Your Total Account Virtual Coins"
          >
            <GoldCoin3D sizePx={18} tiltDeg={-8} />
            <span className="text-xs font-mono font-bold">{formatRupee(walletCoins)}</span>
          </div>

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

          {/* Table Ledger & Match Summary */}
          <button
            onClick={() => {
              setSummaryMode('IN_GAME');
              setShowSummary(true);
            }}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 text-amber-400 rounded-xl border border-zinc-800 hover:border-amber-500/40 transition flex items-center gap-1.5 text-xs font-mono font-bold"
            title="Table Ledger & Settlement Summary"
          >
            <Receipt className="w-4 h-4 text-amber-400" />
            <span className="hidden xl:inline text-zinc-300">LEDGER</span>
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

          {/* Leave Table (opens settlement summary confirmation) */}
          <button
            onClick={() => {
              setSummaryMode('LEAVING');
              setShowSummary(true);
            }}
            className="p-2 bg-zinc-900 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 rounded-xl border border-zinc-800 hover:border-rose-800/50 transition flex items-center gap-1"
            title="Leave Table & Cash Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Right Mobile Toolbar (Clean, Uncluttered: Wallet, Mic, Chat, Menu) */}
        <div className={`${isMobileLandscape ? 'flex' : 'flex sm:hidden'} items-center gap-1 sm:gap-1.5 flex-shrink-0`}>
          {/* Mobile User Account Wallet Balance */}
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-900/90 border border-amber-500/40 text-amber-300 shadow-sm"
            title="Your Total Account Virtual Coins"
          >
            <GoldCoin3D sizePx={14} tiltDeg={-8} />
            <span className="text-[10px] font-mono font-bold">{formatRupee(walletCoins)}</span>
          </div>

          {/* Quick Voice Mic */}
          {onToggleMute && (
            <button
              onClick={onToggleMute}
              className={`p-1.5 sm:p-2 rounded-xl border transition flex items-center ${
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
            className="p-1.5 sm:p-2 bg-zinc-900 text-zinc-300 rounded-xl border border-zinc-800 transition relative active:scale-95"
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
            className="px-2 sm:px-2.5 py-1.5 sm:py-2 bg-zinc-900 hover:bg-zinc-800 text-amber-300 rounded-xl border border-amber-500/40 transition active:scale-95 flex items-center gap-1 shadow-sm"
            title="Table Menu"
          >
            <Menu className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] sm:text-[11px] font-bold text-amber-300 font-mono">Menu</span>
          </button>
        </div>
      </header>

      {/* ══ TABLE ARENA (Portrait Oval on Mobile, Landscape on Desktop) ══ */}
      <main className="flex-1 flex items-center justify-center px-1 sm:px-2 py-0.5 sm:py-2 min-h-0 relative poker-arena-bg w-full overflow-hidden">
        <div
          className="poker-table-outer-rail relative transition-all duration-300"
          style={
            isPortrait
              ? isTablet
                ? {
                    width: 'min(96vw, 720px)',
                    height: '100%',
                    maxHeight: 'calc(100% - 4px)',
                    borderRadius: '160px',
                  }
                : {
                    width: '100%',
                    maxWidth: '480px',
                    height: '100%',
                    maxHeight: '100%',
                    borderRadius: '110px',
                  }
              : isMobileLandscape
              ? {
                  width: 'min(98vw, calc((100dvh - 76px) * 2.2))',
                  height: '100%',
                  maxHeight: 'calc(100dvh - 76px)',
                  aspectRatio: '2.2 / 1',
                  borderRadius: '9999px',
                }
              : {
                  width: '100%',
                  aspectRatio: '1.95 / 1',
                  maxWidth: 'min(96vw, calc((100dvh - 148px) * 1.95))',
                  maxHeight: 'calc(100dvh - 148px)',
                  borderRadius: '9999px',
                }
          }
        >
          {/* Inner Teal Felt Surface */}
          <div
            className="poker-felt-surface w-full h-full relative"
            style={{
              borderRadius: isPortrait ? (isTablet ? '150px' : '102px') : '9999px',
            }}
          >
            {/* ── Visual 3D Chips Out Fly Animation on Winner Payout ── */}
            <ChipsFlyAnimation
              isHandComplete={isHandComplete}
              isMeWinner={isMeWinner}
              myWinAmount={myWonAmount}
              winnerPlayerName={winnerPlayer?.name}
              totalPot={totalWonPot}
              myPlayerId={myPlayerId}
              winnerTargets={winnerFlyTargets}
            />

            {/* Racetrack betting line */}
            <div
              className="poker-betting-line"
              style={{
                borderRadius: isPortrait ? (isTablet ? '135px' : '88px') : '9999px',
              }}
            />

            {/* Luxury Casino Watermark in Center */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.035]">
              <div className="flex items-center gap-2 sm:gap-3 text-amber-200">
                <span className="text-xs sm:text-base font-serif">♠</span>
                <span className="font-serif font-black tracking-[0.28em] text-xl sm:text-3xl md:text-4xl whitespace-nowrap uppercase">
                  ROYAL POKER CLUB
                </span>
                <span className="text-xs sm:text-base font-serif">♦</span>
              </div>
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
                    playerCount={totalPlayerCount}
                    isMobilePortrait={isMobilePortrait}
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
              className="absolute z-20 flex flex-col items-center gap-1 sm:gap-1.5 pointer-events-auto"
              style={{
                left: '50%',
                top: isPortrait ? (isTablet ? '39%' : '40%') : '41%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* When Hand Complete: 3D won chips + Sleek Unified Showdown Pill (Winner + Pot + Hand Rank) */}
              {isHandComplete ? (
                <div className="flex flex-col items-center gap-1 animate-fade-in z-30 mb-1">
                  {totalWonPot > 0 && (
                    <div className="scale-90 sm:scale-100 mb-[-6px]">
                      <PotCoinsVisual
                        pot={totalWonPot}
                        size={isPortrait && !isTablet ? 'sm' : 'md'}
                        showPlaque={false}
                        isHandComplete={true}
                      />
                    </div>
                  )}
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
                  {/* Luxury Casino Pot with 3D Chips & Shiny Gold Coins */}
                  <div className="flex flex-col items-center gap-0.5 pointer-events-auto">
                    <PotCoinsVisual
                      pot={gameState.pot}
                      size={isPortrait && !isTablet ? 'sm' : 'md'}
                      phase={gameState.phase}
                      isHandComplete={isHandComplete}
                    />

                    {/* Side Pots with luxury chips badge */}
                    {gameState.sidePots && gameState.sidePots.length > 1 && (
                      <div className="flex items-center gap-1.5 flex-wrap justify-center pointer-events-auto animate-fade-in mt-0.5">
                        {gameState.sidePots.map((sp, idx) => (
                          <span
                            key={idx}
                            className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-black/80 border border-amber-500/30 text-amber-300/90 shadow-sm flex items-center gap-1"
                          >
                            <span className="text-amber-500/60 text-[8px] font-black">{idx === 0 ? 'MAIN' : `SIDE ${idx}`}</span>
                            <span className="font-bold text-amber-200">{formatRupee(sp.amount)}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* 5 Community Cards */}
              <CommunityCards
                cards={gameState.communityCards}
                phase={gameState.phase}
                winningCards={winningCards}
                compact={isPortrait ? !isTablet : isMobileLandscape}
                ultraCompact={isMobilePortrait && isCrowded}
              />
            </div>

            {/* ── Hero Active Bet Chip in Dedicated Betting Zone (between community cards and HUD) ── */}
            {me && me.currentBet > 0 && !isHandComplete && (
              <div
                className="absolute z-22 pointer-events-auto animate-fade-in"
                style={{
                  left: '50%',
                  top: isPortrait ? (isTablet ? '56%' : '55%') : '55%',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <ChipStack amount={me.currentBet} size={isPortrait ? 'xs' : 'sm'} />
              </div>
            )}

            {/* ── Player's Hole Cards on the Felt (Positioned cleanly right above player seat) ── */}
            {me && me.holeCards && me.holeCards.length > 0 && (
              <div
                className={`absolute z-20 flex items-center -space-x-2 sm:-space-x-1.5 pointer-events-auto transition-all duration-300 ${
                  me.hasFolded ? 'opacity-40 grayscale-[60%] scale-90' : 'opacity-100'
                } ${isMyTurn ? 'p-1 rounded-2xl ring-2 ring-amber-400/80 shadow-[0_0_24px_rgba(251,191,36,0.35)]' : ''}`}
                style={{
                  left: '50%',
                  top: isPortrait ? (isTablet ? '66%' : '65%') : (isMobileLandscape ? '65%' : '67%'),
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
                      size={isPortrait && !isTablet ? 'sm' : 'md'}
                      dealDelayMs={idx * 140}
                      isInteractive={!me.hasFolded}
                      isHighlighted={isWinning}
                      isDimmed={isDim}
                      tiltDeg={idx === 0 ? -4 : 4}
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

            {/* ── "YOU" Seat Pod with Live Win % Bar next to Player Name ── */}
            {me && (
              <div
                className="absolute z-25 pointer-events-auto"
                style={{
                  left: '50%',
                  top: isPortrait ? '88%' : '88%',
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
                  compact={isMobilePortrait || isCrowded}
                  chipPlacement="none"
                  isSpeaking={isVoiceActive && !isMuted}
                  isWinner={isMeWinner}
                  winningCards={winningCards}
                  showdownHoleCards={me.holeCards}
                  isHandComplete={isHandComplete}
                  playerCount={totalPlayerCount}
                  isMobilePortrait={isMobilePortrait}
                  winEquity={!isHandComplete ? myWinEquity : null}
                />
              </div>
            )}

          </div>
        </div>
      </main>

      {/* ══ BOTTOM ACTION ZONE (Pinned cleanly with safe-area spacing) ══ */}
      <footer
        className={`flex-shrink-0 flex flex-col items-center z-30 px-2 sm:px-2.5 ${
          isMobileLandscape ? 'pb-1 pt-0.5' : 'pb-1.5 pt-0.5'
        }`}
        style={{ paddingBottom: 'max(4px, env(safe-area-inset-bottom, 4px))' }}
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
        onLeave={handleLeaveTable}
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

      {/* ══ SESSION COMPLETE SUMMARY / LEDGER MODAL (Screen 10) ══ */}
      {showSummary && (
        <GameSummaryModal
          mode={summaryMode}
          roomCode={roomState.code}
          myPlayerId={myPlayerId}
          ledger={roomState.ledger}
          ledgerSummary={roomState.ledgerSummary}
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
          onConfirmLeave={() => {
            setShowSummary(false);
            handleLeaveTable();
          }}
          onBackToHome={() => {
            setShowSummary(false);
            handleLeaveTable();
          }}
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
        onOpenLedger={() => {
          setSummaryMode('IN_GAME');
          setShowSummary(true);
        }}
        onLeaveRoom={() => {
          setSummaryMode('LEAVING');
          setShowSummary(true);
        }}
        onOpenAddBot={() => setShowAddBotModal(true)}
        canRebuy={canRebuy}
        rebuyDisabledReason={
          isHandInProgress
            ? 'Cannot rebuy while hand is in progress'
            : 'Rebuy only allowed when chips reach ₹0'
        }
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

      {/* ══ ZERO BALANCE 100K RELOAD PROMPT (Strictly when user chips & wallet hit ₹0) ══ */}
      <ZeroBalanceReloadModal
        isOpen={showZeroBalanceReload}
        onClose={() => setShowZeroBalanceReload(false)}
        onReloadSuccess={() => {
          setShowZeroBalanceReload(false);
          if (onRebuyChips && (!me || me.chips <= 0)) {
            handleRebuySubmit(1000);
          }
        }}
        onLeaveTable={() => {
          setShowZeroBalanceReload(false);
          handleLeaveTable();
        }}
      />
    </div>
  );

};
