import React from 'react';
import { formatRupee } from '@poker/shared';
import { soundManager } from '../audio/sound-manager.js';

export type ChipColor = 'red' | 'black' | 'blue' | 'gold' | 'green' | 'white';

interface ChipTheme {
  primary: string;
  secondary: string;
  dotColor: string;
  ringColor: string;
  inlayBg: string;
  inlayBorder: string;
  textColor: string;
  shadowColor: string;
  edgePrimary: string;
  edgeSecondary: string;
}

export const CHIP_THEMES: Record<ChipColor, ChipTheme> = {
  // 1. Red Chip (Crimson with pink/white edge spots and white dots)
  red: {
    primary: '#991b1b',
    secondary: '#fecdd3',
    dotColor: '#ffffff',
    ringColor: 'rgba(255, 255, 255, 0.45)',
    inlayBg: 'radial-gradient(circle at 40% 35%, #b91c1c 0%, #7f1d1d 70%, #450a0a 100%)',
    inlayBorder: '#f43f5e',
    textColor: '#ffffff',
    shadowColor: 'rgba(185, 28, 28, 0.4)',
    edgePrimary: '#881337',
    edgeSecondary: '#fecdd3',
  },
  // 2. Black Chip (Onyx black with white blocks and white dots)
  black: {
    primary: '#18181b',
    secondary: '#f4f4f5',
    dotColor: '#ffffff',
    ringColor: 'rgba(255, 255, 255, 0.35)',
    inlayBg: 'radial-gradient(circle at 40% 35%, #27272a 0%, #18181b 70%, #09090b 100%)',
    inlayBorder: '#71717a',
    textColor: '#f4f4f5',
    shadowColor: 'rgba(0, 0, 0, 0.7)',
    edgePrimary: '#18181b',
    edgeSecondary: '#e4e4e7',
  },
  // 3. Blue Chip (Royal blue with sky blue blocks and white dots)
  blue: {
    primary: '#1e40af',
    secondary: '#bfdbfe',
    dotColor: '#ffffff',
    ringColor: 'rgba(255, 255, 255, 0.45)',
    inlayBg: 'radial-gradient(circle at 40% 35%, #2563eb 0%, #1d4ed8 70%, #0f172a 100%)',
    inlayBorder: '#38bdf8',
    textColor: '#ffffff',
    shadowColor: 'rgba(30, 64, 175, 0.45)',
    edgePrimary: '#1e3a8a',
    edgeSecondary: '#bfdbfe',
  },
  // 4. Gold & Black High-Roller Chip (Pitch black core with metallic gold foil blocks and dots)
  gold: {
    primary: '#09090b',
    secondary: '#fbbf24',
    dotColor: '#fde047',
    ringColor: 'rgba(251, 191, 36, 0.7)',
    inlayBg: 'radial-gradient(circle at 40% 35%, #18181b 0%, #09090b 80%, #000000 100%)',
    inlayBorder: '#f59e0b',
    textColor: '#fef08a',
    shadowColor: 'rgba(245, 158, 11, 0.45)',
    edgePrimary: '#18181b',
    edgeSecondary: '#f59e0b',
  },
  // 5. Green Chip (Emerald green with mint blocks and white dots)
  green: {
    primary: '#166534',
    secondary: '#bbf7d0',
    dotColor: '#ffffff',
    ringColor: 'rgba(255, 255, 255, 0.45)',
    inlayBg: 'radial-gradient(circle at 40% 35%, #15803d 0%, #14532d 70%, #052e16 100%)',
    inlayBorder: '#34d399',
    textColor: '#ffffff',
    shadowColor: 'rgba(22, 101, 52, 0.45)',
    edgePrimary: '#14532d',
    edgeSecondary: '#bbf7d0',
  },
  // 6. White Chip (Ivory white with black blocks and black dots)
  white: {
    primary: '#f8fafc',
    secondary: '#0f172a',
    dotColor: '#0f172a',
    ringColor: 'rgba(15, 23, 42, 0.35)',
    inlayBg: 'radial-gradient(circle at 40% 35%, #ffffff 0%, #e2e8f0 75%, #cbd5e1 100%)',
    inlayBorder: '#94a3b8',
    textColor: '#0f172a',
    shadowColor: 'rgba(100, 116, 139, 0.35)',
    edgePrimary: '#e2e8f0',
    edgeSecondary: '#0f172a',
  },
};

/**
 * High-Resolution Authentic Vector Casino Chip Face (Top Surface Disc)
 * Exactly reproduces the 6-stripe clay pattern, circular accent dots, and gear ring from Image 2.
 */
export const CasinoChipFaceSVG: React.FC<{
  color: ChipColor;
  sizePx: number;
  label?: string;
}> = ({ color, sizePx, label = '₹' }) => {
  const theme = CHIP_THEMES[color];

  // 6 symmetric segments around 360° (every 60°)
  // Each segment has a 28° wide contrasting block, and between each block at 30° offset is an accent dot.
  const segments = [0, 60, 120, 180, 240, 300];

  return (
    <svg
      width={sizePx}
      height={sizePx}
      viewBox="0 0 100 100"
      className="shrink-0 select-none pointer-events-none drop-shadow-sm"
    >
      <defs>
        {/* Subtle radial sheen */}
        <radialGradient id={`gloss-${color}`} cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.35" />
        </radialGradient>

        {/* Center well inner shadow */}
        <radialGradient id={`inlay-shadow-${color}`} cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.55" />
        </radialGradient>
      </defs>

      {/* 1. Base Outer Rim Circle */}
      <circle cx="50" cy="50" r="48" fill={theme.primary} stroke="#09090b" strokeWidth="1" />

      {/* 2. 6 Contrasting Edge Blocks (Authentic Casino Inserts) */}
      {segments.map((angle) => {
        // SVG Arc wedge between -14° and +14° around the angle
        const startRad = ((angle - 14) * Math.PI) / 180;
        const endRad = ((angle + 14) * Math.PI) / 180;
        const x1 = 50 + 48 * Math.cos(startRad);
        const y1 = 50 + 48 * Math.sin(startRad);
        const x2 = 50 + 48 * Math.cos(endRad);
        const y2 = 50 + 48 * Math.sin(endRad);

        const x3 = 50 + 34 * Math.cos(endRad);
        const y3 = 50 + 34 * Math.sin(endRad);
        const x4 = 50 + 34 * Math.cos(startRad);
        const y4 = 50 + 34 * Math.sin(startRad);

        return (
          <path
            key={`block-${angle}`}
            d={`M ${x1} ${y1} A 48 48 0 0 1 ${x2} ${y2} L ${x3} ${y3} A 34 34 0 0 0 ${x4} ${y4} Z`}
            fill={theme.secondary}
          />
        );
      })}

      {/* 3. 6 Circular Accent Dots positioned between the edge blocks (at angle + 30°) */}
      {segments.map((angle) => {
        const dotAngle = ((angle + 30) * Math.PI) / 180;
        const dotX = 50 + 41 * Math.cos(dotAngle);
        const dotY = 50 + 41 * Math.sin(dotAngle);
        return (
          <circle
            key={`dot-${angle}`}
            cx={dotX}
            cy={dotY}
            r="3.2"
            fill={theme.dotColor}
            stroke="rgba(0,0,0,0.4)"
            strokeWidth="0.5"
          />
        );
      })}

      {/* 4. Outer Ring Border */}
      <circle cx="50" cy="50" r="34" fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="0.8" />

      {/* 5. Inner Notched / Dental Gear Ring Band */}
      <circle
        cx="50"
        cy="50"
        r="31"
        fill="none"
        stroke={theme.ringColor}
        strokeWidth="3.2"
        strokeDasharray="3 2"
      />

      <circle cx="50" cy="50" r="28" fill="none" stroke="rgba(0,0,0,0.6)" strokeWidth="0.8" />

      {/* 6. Recessed Center Well (The Inlay) */}
      <circle
        cx="50"
        cy="50"
        r="27"
        fill={theme.primary}
        stroke={theme.inlayBorder}
        strokeWidth="1.5"
      />
      <circle cx="50" cy="50" r="27" fill={`url(#inlay-shadow-${color})`} />

      {/* Inner Foil Ring */}
      <circle cx="50" cy="50" r="23" fill="none" stroke={theme.inlayBorder} strokeWidth="0.75" />

      {/* 7. Center Rupee Emblem / Denomination */}
      <text
        x="50"
        y="55"
        textAnchor="middle"
        dominantBaseline="middle"
        fill={theme.textColor}
        fontFamily="sans-serif"
        fontWeight="900"
        fontSize="17"
        letterSpacing="-0.5"
      >
        {label}
      </text>

      {/* 8. Top Glass Sheen */}
      <circle cx="50" cy="50" r="48" fill={`url(#gloss-${color})`} pointerEvents="none" />
    </svg>
  );
};

/**
 * 3D Isometric Casino Poker Chip with Cylindrical Clay Thickness & Matching Edge Stripes
 */
export const CasinoChip3D: React.FC<{
  color: ChipColor;
  sizePx?: number;
  label?: string;
  className?: string;
  onClick?: () => void;
}> = ({ color, sizePx = 28, label = '₹', className = '', onClick }) => {
  const theme = CHIP_THEMES[color];
  const h = Math.max(3, Math.round(sizePx * 0.14)); // Cylindrical edge thickness

  return (
    <div
      className={`relative inline-flex flex-col items-center select-none cursor-pointer group transition-transform hover:scale-105 active:scale-95 ${className}`}
      style={{ width: `${sizePx}px`, height: `${Math.round(sizePx * 0.8) + h}px` }}
      onClick={() => {
        soundManager.playCallChips();
        if (onClick) onClick();
      }}
    >
      {/* ── Soft Felt Contact Drop Shadow ── */}
      <div
        className="absolute -bottom-1 w-[92%] h-3 bg-black/70 rounded-full blur-[2px] pointer-events-none"
        style={{ transform: 'translateY(1px)' }}
      />

      {/* ── Top Disc (3D Perspective Tilt) ── */}
      <div
        className="relative z-20 w-full"
        style={{
          height: `${Math.round(sizePx * 0.76)}px`,
          transform: 'scaleY(0.76)',
          transformOrigin: 'top center',
        }}
      >
        <div className="w-full h-full flex items-center justify-center">
          <CasinoChipFaceSVG color={color} sizePx={sizePx} label={label} />
        </div>
      </div>

      {/* ── 3D Cylindrical Clay Edge Profile with Matching Stripes ── */}
      <div
        className="relative z-10 w-full rounded-b-full overflow-hidden shrink-0 -mt-1"
        style={{
          height: `${h}px`,
          background: `linear-gradient(to right, #09090b 0%, ${theme.edgePrimary} 25%, #ffffff 50%, ${theme.edgePrimary} 75%, #09090b 100%)`,
          boxShadow: `0 2px 4px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.6)`,
          borderBottom: `1px solid rgba(0,0,0,0.8)`,
        }}
      >
        {/* Authentic alternating clay edge stripe notches */}
        <div className="absolute inset-0 flex justify-between items-center px-1 opacity-80 pointer-events-none">
          <div className="w-1.5 h-full" style={{ backgroundColor: theme.edgeSecondary }} />
          <div className="w-1.5 h-full" style={{ backgroundColor: theme.edgeSecondary }} />
          <div className="w-1.5 h-full" style={{ backgroundColor: theme.edgeSecondary }} />
        </div>
      </div>
    </div>
  );
};

/**
 * 3D High-Gloss Metallic Golden Coin
 * Gleaming radial specular shine, milled reeded rim, and embossed ₹ symbol with ambient golden glow.
 */
export const GoldCoin3D: React.FC<{
  sizePx?: number;
  tiltDeg?: number;
  className?: string;
  onClick?: () => void;
}> = ({ sizePx = 25, tiltDeg = -14, className = '', onClick }) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none cursor-pointer transition-transform hover:scale-110 active:scale-95 drop-shadow-[0_3px_6px_rgba(0,0,0,0.75)] ${className}`}
      style={{
        width: `${sizePx}px`,
        height: `${Math.round(sizePx * 0.74)}px`,
        transform: `rotate(${tiltDeg}deg)`,
      }}
      onClick={() => {
        soundManager.playCoinClink();
        if (onClick) onClick();
      }}
    >
      {/* Outer 3D Coin Disc */}
      <div
        className="w-full h-full rounded-full flex items-center justify-center relative overflow-hidden shadow-inner"
        style={{
          background: `radial-gradient(ellipse at 35% 26%, #ffffff 0%, #fef08a 22%, #eab308 52%, #ca8a04 78%, #713f12 100%)`,
          border: `1.5px solid #fef9c3`,
          boxShadow: `0 3px 6px rgba(0,0,0,0.7), inset 0 1.5px 2px rgba(255,255,255,0.95), 0 0 12px rgba(234,179,8,0.45)`,
        }}
      >
        {/* Milled Reeded Outer Rim Ring */}
        <div
          className="absolute rounded-full border border-dashed border-amber-950/60 pointer-events-none"
          style={{
            width: `${Math.round(sizePx * 0.78)}px`,
            height: `${Math.round(sizePx * 0.54)}px`,
          }}
        />

        {/* Embossed ₹ Symbol */}
        <span
          className="font-black font-serif text-amber-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)] select-none leading-none z-10"
          style={{ fontSize: `${Math.max(9, Math.round(sizePx * 0.44))}px` }}
        >
          ₹
        </span>

        {/* Diagonal specular glare bar */}
        <div
          className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent pointer-events-none"
          style={{ transform: 'rotate(25deg)' }}
        />
      </div>
    </div>
  );
};

/**
 * 3D Vertical Stack of Clay Casino Chips
 */
export const CasinoChipStack3D: React.FC<{
  color: ChipColor;
  count: number;
  sizePx?: number;
  label?: string;
  className?: string;
}> = ({ color, count, sizePx = 28, label = '₹', className = '' }) => {
  const theme = CHIP_THEMES[color];
  const h = Math.max(3, Math.round(sizePx * 0.13)); // Chip edge height
  const actualCount = Math.max(1, Math.min(8, count));

  return (
    <div
      className={`relative flex flex-col items-center select-none ${className}`}
      style={{ width: `${sizePx}px` }}
    >
      {/* Top Chip with full Face Disc */}
      <div className="relative z-30 mb-[-6px] sm:mb-[-8px]">
        <div
          className="w-full"
          style={{
            height: `${Math.round(sizePx * 0.74)}px`,
            transform: 'scaleY(0.74)',
            transformOrigin: 'top center',
          }}
        >
          <CasinoChipFaceSVG color={color} sizePx={sizePx} label={label} />
        </div>
      </div>

      {/* Layered Cylindrical Edge Discs */}
      <div className="flex flex-col-reverse items-center z-20">
        {Array.from({ length: actualCount }).map((_, idx) => (
          <div
            key={idx}
            className="relative rounded-full overflow-hidden shrink-0 -mb-1"
            style={{
              width: `${sizePx}px`,
              height: `${h}px`,
              background: `linear-gradient(to right, #09090b 0%, ${theme.edgePrimary} 25%, #ffffff 50%, ${theme.edgePrimary} 75%, #09090b 100%)`,
              boxShadow: `0 1px 3px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.6)`,
              borderBottom: `0.5px solid rgba(0,0,0,0.8)`,
              zIndex: idx,
            }}
          >
            {/* Clay edge notches */}
            <div className="absolute inset-0 flex justify-between items-center px-1 opacity-80 pointer-events-none">
              <div className="w-1 h-full" style={{ backgroundColor: theme.edgeSecondary }} />
              <div className="w-1 h-full" style={{ backgroundColor: theme.edgeSecondary }} />
              <div className="w-1 h-full" style={{ backgroundColor: theme.edgeSecondary }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
