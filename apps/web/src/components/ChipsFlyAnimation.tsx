import React, { useEffect, useState, useRef } from 'react';
import { formatRupee } from '@poker/shared';
import { soundManager } from '../audio/sound-manager.js';
import { GoldCoin3D, CasinoChip3D } from './CasinoChip3D.js';

export interface WinnerFlyTarget {
  playerId: string;
  playerName: string;
  isMe: boolean;
  xPercent: number; // 0-100
  yPercent: number; // 0-100
  amount: number;
}

interface ChipsFlyAnimationProps {
  isHandComplete: boolean;
  isMeWinner: boolean;
  myWinAmount?: number;
  winnerPlayerName?: string;
  totalPot: number;
  myPlayerId: string;
  winnerTargets?: WinnerFlyTarget[];
}

export const ChipsFlyAnimation: React.FC<ChipsFlyAnimationProps> = ({
  isHandComplete,
  isMeWinner,
  myWinAmount = 0,
  winnerPlayerName,
  totalPot,
  myPlayerId,
  winnerTargets = [],
}) => {
  const [animating, setAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState<{ width: number; height: number }>({
    width: 800,
    height: 500,
  });

  useEffect(() => {
    if (isHandComplete && totalPot > 0) {
      if (containerRef.current) {
        setContainerDimensions({
          width: containerRef.current.clientWidth || 800,
          height: containerRef.current.clientHeight || 500,
        });
      }
      setAnimating(true);

      if (isMeWinner) {
        soundManager.playWin();
      }
      setTimeout(() => soundManager.playCoinClink(), 350);
      setTimeout(() => soundManager.playCoinClink(), 700);

      const timer = setTimeout(() => {
        setAnimating(false);
      }, 4500);

      return () => clearTimeout(timer);
    } else {
      setAnimating(false);
    }
  }, [isHandComplete, isMeWinner, totalPot]);

  if (!animating) return null;

  // Determine active targets: if winnerTargets provided, use them; otherwise fallback
  const targets: WinnerFlyTarget[] =
    winnerTargets.length > 0
      ? winnerTargets
      : [
          {
            playerId: isMeWinner ? myPlayerId : 'opponent',
            playerName: winnerPlayerName || 'Winner',
            isMe: isMeWinner,
            xPercent: 50,
            yPercent: isMeWinner ? 88 : 16,
            amount: totalPot,
          },
        ];

  const potOriginX = containerDimensions.width * 0.5;
  const potOriginY = containerDimensions.height * 0.3;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none z-30 overflow-hidden"
    >
      {/* ── Directional Stream of 3D Gold Coins & Casino Chips Flying to each Winner Seat ── */}
      {targets.map((target, targetIdx) => {
        const destX = containerDimensions.width * (target.xPercent / 100);
        const destY = containerDimensions.height * (target.yPercent / 100);
        const dx = destX - potOriginX;
        const dy = destY - potOriginY;

        // Number of coins per target
        const coinCount = targets.length > 1 ? 6 : 9;

        return (
          <div
            key={target.playerId || targetIdx}
            className="absolute left-1/2 top-[30%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none"
          >
            {Array.from({ length: coinCount }).map((_, i) => {
              const delay = i * 75 + targetIdx * 60;
              // Subtle scatter around trajectory
              const scatterX = ((i % 3) - 1) * (14 + i * 2);
              const scatterY = (i % 2 === 0 ? -1 : 1) * (8 + i * 3);

              return (
                <div
                  key={i}
                  className="absolute animate-chip-fly-directional"
                  style={
                    {
                      '--dx': `${dx.toFixed(1)}px`,
                      '--dy': `${dy.toFixed(1)}px`,
                      '--sx': `${scatterX}px`,
                      '--sy': `${scatterY}px`,
                      animationDelay: `${delay}ms`,
                    } as React.CSSProperties
                  }
                >
                  {i % 2 === 0 ? (
                    <GoldCoin3D sizePx={26} tiltDeg={(i * 20) - 25} />
                  ) : (
                    <CasinoChip3D
                      color={i % 3 === 0 ? 'gold' : target.isMe ? 'blue' : 'red'}
                      sizePx={26}
                    />

                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* ── Winner Payout Callout Banner for Local Player ── */}
      {isMeWinner && myWinAmount > 0 && (
        <div className="absolute bottom-[27%] sm:bottom-[25%] left-1/2 -translate-x-1/2 z-40 animate-bounce pointer-events-none">
          <div className="flex items-center gap-2.5 px-4 sm:px-5 py-2 rounded-2xl bg-gradient-to-r from-amber-950/95 via-zinc-950/95 to-amber-950/95 border-2 border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.65)] backdrop-blur-md select-none">
            <div className="relative">
              <GoldCoin3D sizePx={30} tiltDeg={-12} />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
              </span>
            </div>

            <div className="flex flex-col text-left">
              <span className="text-[9.5px] font-mono font-bold uppercase tracking-widest text-amber-300">
                CHIPS OUT & CREDITED!
              </span>
              <span className="text-base sm:text-lg font-black font-mono text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                +{formatRupee(myWinAmount)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

