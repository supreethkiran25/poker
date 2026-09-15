import React from 'react';
import type { HoleCardItem } from '@poker/shared';

interface CardViewProps {
  card?: HoleCardItem;
  size?: 'sm' | 'md' | 'lg';
  isHighlighted?: boolean;
  dealDelayMs?: number;
  isInteractive?: boolean;
  tiltDeg?: number;
}

// Crisp Vector SVG Suits for realistic casino look
export const SuitIcon: React.FC<{ suit: string; className?: string; size?: number }> = ({
  suit,
  className = '',
  size = 16,
}) => {
  switch (suit) {
    case 's':
      return (
        <svg
          viewBox="0 0 100 115"
          width={size}
          height={size}
          className={`shrink-0 ${className}`}
          fill="currentColor"
        >
          <path d="M50 8 C46 22 20 45 20 66 C20 80 32 90 45 88 C46 87 47 86 48 84 C46 91 40 101 33 107 L67 107 C60 101 54 91 52 84 C53 86 54 87 55 88 C68 90 80 80 80 66 C80 45 54 22 50 8 Z" />
        </svg>
      );
    case 'h':
      return (
        <svg
          viewBox="0 0 100 100"
          width={size}
          height={size}
          className={`shrink-0 ${className}`}
          fill="currentColor"
        >
          <path d="M50 90 C22 66 10 48 10 32 C10 17 21 8 36 8 C44 8 48 12 50 16 C52 12 56 8 64 8 C79 8 90 17 90 32 C90 48 78 66 50 90 Z" />
        </svg>
      );
    case 'd':
      return (
        <svg
          viewBox="0 0 100 100"
          width={size}
          height={size}
          className={`shrink-0 ${className}`}
          fill="currentColor"
        >
          <path d="M50 8 C47 30 35 44 10 50 C35 56 47 70 50 92 C53 70 65 56 90 50 C65 44 53 30 50 8 Z" />
        </svg>
      );
    case 'c':
      return (
        <svg
          viewBox="0 0 100 115"
          width={size}
          height={size}
          className={`shrink-0 ${className}`}
          fill="currentColor"
        >
          <path d="M50 10 C42 10 35 16 35 25 C35 31 39 36 44 38 C40 38 37 38 35 38 C24 38 16 46 16 57 C16 67 24 75 35 75 C39 75 43 73 46 70 C45 74 41 84 34 91 L66 91 C59 84 55 74 54 70 C57 73 61 75 65 75 C76 75 84 67 84 57 C84 46 76 38 65 38 C63 38 60 38 56 38 C61 36 65 31 65 25 C65 16 58 10 50 10 Z" />
        </svg>
      );
    default:
      return null;
  }
};

const RANK_LABELS: Record<number, string> = {
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'J',
  12: 'Q',
  13: 'K',
  14: 'A',
};

// Dimensions matching existing table geometry with authentic playing card proportions
const SIZE_CONFIG = {
  sm: {
    card: 'w-9 h-[54px] rounded-[5px]',
    cornerIndex: 'text-[9px] font-black tracking-tight',
    cornerSuitSize: 8,
    cornerGap: 'space-y-[0.5px]',
    innerPadding: 'p-1',
    innerBorderInset: 'inset-[1.5px]',
    pipSize: 10,
    centerWatermarkSize: 22,
  },
  md: {
    card: 'w-14 h-[84px] rounded-[7px]',
    cornerIndex: 'text-[11px] font-black tracking-tight',
    cornerSuitSize: 10,
    cornerGap: 'space-y-0.5',
    innerPadding: 'p-1.5',
    innerBorderInset: 'inset-[2.5px]',
    pipSize: 13,
    centerWatermarkSize: 32,
  },
  lg: {
    card: 'w-[72px] h-[106px] rounded-[9px]',
    cornerIndex: 'text-sm font-black tracking-tight',
    cornerSuitSize: 12,
    cornerGap: 'space-y-0.5',
    innerPadding: 'p-2',
    innerBorderInset: 'inset-[3px]',
    pipSize: 16,
    centerWatermarkSize: 42,
  },
};

// Traditional playing card pip coordinates [x%, y%, isFlipped?]
const PIP_LAYOUTS: Record<number, [number, number, boolean?][]> = {
  2: [
    [50, 24],
    [50, 76, true],
  ],
  3: [
    [50, 24],
    [50, 50],
    [50, 76, true],
  ],
  4: [
    [32, 24],
    [68, 24],
    [32, 76, true],
    [68, 76, true],
  ],
  5: [
    [32, 24],
    [68, 24],
    [50, 50],
    [32, 76, true],
    [68, 76, true],
  ],
  6: [
    [32, 24],
    [68, 24],
    [32, 50],
    [68, 50],
    [32, 76, true],
    [68, 76, true],
  ],
  7: [
    [32, 24],
    [68, 24],
    [50, 37],
    [32, 50],
    [68, 50],
    [32, 76, true],
    [68, 76, true],
  ],
  8: [
    [32, 24],
    [68, 24],
    [50, 36],
    [32, 50],
    [68, 50],
    [50, 64, true],
    [32, 76, true],
    [68, 76, true],
  ],
  9: [
    [32, 22],
    [68, 22],
    [32, 40],
    [68, 40],
    [50, 50],
    [32, 60, true],
    [68, 60, true],
    [32, 78, true],
    [68, 78, true],
  ],
  10: [
    [32, 20],
    [68, 20],
    [50, 31],
    [32, 40],
    [68, 40],
    [32, 60, true],
    [68, 60, true],
    [50, 69, true],
    [32, 80, true],
    [68, 80, true],
  ],
};

// Grand Ace of Spades Luxury Medallion
const AceOfSpadesMedallion: React.FC<{ size: 'sm' | 'md' | 'lg' }> = ({ size }) => {
  const iconSize = size === 'sm' ? 26 : size === 'md' ? 44 : 56;
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
      <div className="relative flex items-center justify-center">
        {/* Subtle decorative filigree ring */}
        <div
          className="absolute rounded-full border border-amber-600/30 animate-spin-slow"
          style={{
            width: iconSize + 10,
            height: iconSize + 10,
            background:
              'radial-gradient(circle, rgba(212,175,55,0.12) 0%, rgba(212,175,55,0.02) 65%, transparent 100%)',
          }}
        />
        {/* Central grand spade */}
        <div className="text-zinc-900 drop-shadow-md z-10">
          <SuitIcon suit="s" size={iconSize} />
        </div>
      </div>
    </div>
  );
};

// Authentic Reversible Court Card Artwork (Jack, Queen, King)
const CourtCardIllustration: React.FC<{
  rank: number;
  suit: string;
  size: 'sm' | 'md' | 'lg';
  isRed: boolean;
}> = ({ rank, suit, size, isRed }) => {
  const isKing = rank === 13;
  const isQueen = rank === 12;
  const isJack = rank === 11;

  const primaryColor = isRed ? '#dc2626' : '#1e293b';
  const goldColor = '#d97706';

  if (size === 'sm') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center shadow-inner"
          style={{
            background: isRed
              ? 'radial-gradient(circle, rgba(220,38,38,0.15) 0%, transparent 80%)'
              : 'radial-gradient(circle, rgba(15,23,42,0.12) 0%, transparent 80%)',
            border: `1px solid ${isRed ? 'rgba(220,38,38,0.3)' : 'rgba(15,23,42,0.25)'}`,
          }}
        >
          <span className="text-[10px] font-black" style={{ color: primaryColor }}>
            {isKing ? 'K' : isQueen ? 'Q' : 'J'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-x-2.5 inset-y-3.5 flex flex-col items-center justify-center pointer-events-none select-none overflow-hidden rounded-[3px] border border-amber-900/20 bg-amber-50/40">
      {/* Symmetrical Court Illustration Container */}
      <svg
        viewBox="0 0 100 120"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id={`goldGrad-${rank}-${suit}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>
          <linearGradient id={`robeGrad-${rank}-${suit}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isRed ? '#f87171' : '#60a5fa'} />
            <stop offset="100%" stopColor={isRed ? '#991b1b' : '#1e3a8a'} />
          </linearGradient>
        </defs>

        {/* Diagonal Heraldic Divider Line */}
        <line x1="0" y1="120" x2="100" y2="0" stroke="rgba(217, 119, 6, 0.4)" strokeWidth="1" strokeDasharray="2,2" />

        {/* Top Half Portrait */}
        <g>
          {/* Robe / Collar */}
          <path
            d="M 25 55 L 35 32 L 65 32 L 75 55 Z"
            fill={`url(#robeGrad-${rank}-${suit})`}
            stroke={goldColor}
            strokeWidth="1.2"
          />
          {/* Royal Sceptre / Ornament */}
          <circle cx="50" cy="42" r="3.5" fill={`url(#goldGrad-${rank}-${suit})`} stroke="#b45309" strokeWidth="0.8" />
          {/* Head & Face */}
          <ellipse cx="50" cy="24" rx="10" ry="12" fill="#fffbeb" stroke="#78350f" strokeWidth="1.2" />
          {/* Crown / Headdress */}
          {isKing && (
            <path
              d="M 38 16 L 42 7 L 50 12 L 58 7 L 62 16 Z"
              fill={`url(#goldGrad-${rank}-${suit})`}
              stroke="#92400e"
              strokeWidth="1"
            />
          )}
          {isQueen && (
            <path
              d="M 40 16 C 40 10 60 10 60 16 L 62 16 L 50 9 L 38 16 Z"
              fill={`url(#goldGrad-${rank}-${suit})`}
              stroke="#92400e"
              strokeWidth="1"
            />
          )}
          {isJack && (
            <path
              d="M 38 16 C 42 8 58 8 62 16 Z"
              fill={isRed ? '#dc2626' : '#2563eb'}
              stroke={goldColor}
              strokeWidth="1"
            />
          )}
        </g>

        {/* Center Suit Crest Emblem */}
        <circle cx="50" cy="60" r="11" fill="#fffbeb" stroke="rgba(217,119,6,0.6)" strokeWidth="1.2" />

        {/* Bottom Half Inverted Portrait */}
        <g transform="rotate(180 50 60)">
          {/* Robe / Collar */}
          <path
            d="M 25 55 L 35 32 L 65 32 L 75 55 Z"
            fill={`url(#robeGrad-${rank}-${suit})`}
            stroke={goldColor}
            strokeWidth="1.2"
          />
          {/* Royal Sceptre / Ornament */}
          <circle cx="50" cy="42" r="3.5" fill={`url(#goldGrad-${rank}-${suit})`} stroke="#b45309" strokeWidth="0.8" />
          {/* Head & Face */}
          <ellipse cx="50" cy="24" rx="10" ry="12" fill="#fffbeb" stroke="#78350f" strokeWidth="1.2" />
          {/* Crown / Headdress */}
          {isKing && (
            <path
              d="M 38 16 L 42 7 L 50 12 L 58 7 L 62 16 Z"
              fill={`url(#goldGrad-${rank}-${suit})`}
              stroke="#92400e"
              strokeWidth="1"
            />
          )}
          {isQueen && (
            <path
              d="M 40 16 C 40 10 60 10 60 16 L 62 16 L 50 9 L 38 16 Z"
              fill={`url(#goldGrad-${rank}-${suit})`}
              stroke="#92400e"
              strokeWidth="1"
            />
          )}
          {isJack && (
            <path
              d="M 38 16 C 42 8 58 8 62 16 Z"
              fill={isRed ? '#dc2626' : '#2563eb'}
              stroke={goldColor}
              strokeWidth="1"
            />
          )}
        </g>
      </svg>

      {/* Embedded Suit in Center Crest */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ color: primaryColor }}>
        <SuitIcon suit={suit} size={size === 'md' ? 14 : 18} />
      </div>
    </div>
  );
};

export const CardView: React.FC<CardViewProps> = ({
  card,
  size = 'md',
  isHighlighted = false,
  dealDelayMs = 0,
  isInteractive = false,
  tiltDeg = 0,
}) => {
  const s = SIZE_CONFIG[size];

  // ── Face-down card: Authentic Luxury Casino Card Back ──
  if (!card || 'hidden' in card) {
    return (
      <div
        className={`${s.card} relative select-none overflow-hidden realistic-card-shadow card-cinematic-deal transition-transform`}
        style={{
          backgroundColor: '#ffffff',
          animationDelay: `${dealDelayMs}ms`,
          transform: tiltDeg ? `rotate(${tiltDeg}deg)` : undefined,
          boxShadow:
            '0 4px 10px -1px rgba(0, 0, 0, 0.6), 0 1px 3px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(0,0,0,0.12)',
        }}
      >
        {/* Authentic 2.5px white border margin as seen on real casino decks */}
        <div
          className="absolute inset-[2.5px] rounded-[4px] overflow-hidden flex items-center justify-center"
          style={{
            background:
              'linear-gradient(135deg, #180305 0%, #660c15 35%, #88131e 50%, #660c15 65%, #180305 100%)',
            border: '1px solid rgba(212, 175, 55, 0.45)',
          }}
        >
          {/* Diamond Guilloche Tapestry Pattern */}
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: `
                radial-gradient(circle at center, rgba(254, 240, 138, 0.25) 0%, transparent 60%),
                repeating-linear-gradient(45deg, rgba(212, 175, 55, 0.35) 0px, rgba(212, 175, 55, 0.35) 1px, transparent 1px, transparent 6px),
                repeating-linear-gradient(-45deg, rgba(212, 175, 55, 0.35) 0px, rgba(212, 175, 55, 0.35) 1px, transparent 1px, transparent 6px)
              `,
            }}
          />

          {/* Symmetrical Golden Medallion */}
          <div
            className="relative z-10 rounded-full flex items-center justify-center shadow-lg"
            style={{
              width: size === 'sm' ? 22 : size === 'md' ? 36 : 48,
              height: size === 'sm' ? 22 : size === 'md' ? 36 : 48,
              background: 'radial-gradient(circle, #fef08a 0%, #d97706 60%, #78350f 100%)',
              border: '1.5px solid #fef3c7',
              boxShadow: '0 2px 6px rgba(0,0,0,0.7)',
            }}
          >
            <span
              className="font-serif font-black select-none text-zinc-950"
              style={{ fontSize: size === 'sm' ? 10 : size === 'md' ? 16 : 22 }}
            >
              ♠
            </span>
          </div>

          {/* Satin Sheen Reflection Across Face */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(125deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 30%, transparent 60%)',
            }}
          />
        </div>
      </div>
    );
  }

  const isRed = card.suit === 'h' || card.suit === 'd';
  const rankStr = RANK_LABELS[card.rank] || String(card.rank);
  const color = isRed ? '#dc2626' : '#111827';
  const isCourt = card.rank >= 11 && card.rank <= 13;
  const isAceOfSpades = card.rank === 14 && card.suit === 's';
  const isNumbered = card.rank >= 2 && card.rank <= 10;

  return (
    <div
      className={`${s.card} ${s.innerPadding} relative select-none realistic-card-shadow card-cinematic-deal flex flex-col justify-between ${
        isInteractive ? 'hole-card-interactive' : ''
      } ${
        isHighlighted
          ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-zinc-950 scale-105'
          : ''
      }`}
      style={{
        // Realistic multi-layer linen finish cardstock
        background: 'radial-gradient(130% 120% at 50% 10%, #ffffff 0%, #faf8f5 65%, #f2ede4 100%)',
        border: isHighlighted ? '1.5px solid #fbbf24' : '1px solid #cbd5e1',
        animationDelay: `${dealDelayMs}ms`,
        transform: tiltDeg && !isInteractive ? `rotate(${tiltDeg}deg)` : undefined,
        boxShadow: isHighlighted
          ? '0 0 16px rgba(251, 191, 36, 0.6), 0 4px 12px rgba(0,0,0,0.5)'
          : '0 4px 12px -2px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(255,255,255,0.85)',
      }}
    >
      {/* Authentic Printed Hairline Margin Inset */}
      <div
        className={`absolute ${s.innerBorderInset} rounded-[4px] border border-zinc-300/40 pointer-events-none`}
      />

      {/* ── Top-Left Index (Rank + Miniature Suit) ── */}
      <div
        className={`flex flex-col items-center leading-none pointer-events-none z-10 ${s.cornerGap}`}
        style={{ color }}
      >
        <span className={`${s.cornerIndex} leading-none tracking-tighter`}>{rankStr}</span>
        <SuitIcon suit={card.suit} size={s.cornerSuitSize} />
      </div>

      {/* ── Card Centerpiece: Authentic Layouts ── */}
      {isAceOfSpades ? (
        /* Grand Ace of Spades Medallion */
        <AceOfSpadesMedallion size={size} />
      ) : isCourt ? (
        /* Reversible Royal Court Card Portrait */
        <CourtCardIllustration rank={card.rank} suit={card.suit} size={size} isRed={isRed} />
      ) : isNumbered && (size === 'md' || size === 'lg') ? (
        /* Traditional Physical Card Pip Arrangements (2 through 10) */
        <div className="absolute inset-x-2 inset-y-3 pointer-events-none select-none">
          {PIP_LAYOUTS[card.rank]?.map(([x, y, isFlipped], idx) => (
            <div
              key={idx}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center drop-shadow-xs"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                color,
                transform: isFlipped
                  ? 'translate(-50%, -50%) rotate(180deg)'
                  : 'translate(-50%, -50%)',
              }}
            >
              <SuitIcon suit={card.suit} size={s.pipSize} />
            </div>
          ))}
        </div>
      ) : (
        /* Center Suit Watermark (For small cards or regular Aces) */
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
          style={{ color, opacity: card.rank === 14 ? 0.95 : 0.8 }}
        >
          <SuitIcon
            suit={card.suit}
            size={card.rank === 14 ? s.centerWatermarkSize + 4 : s.centerWatermarkSize}
            className="filter drop-shadow-xs"
          />
        </div>
      )}

      {/* ── Bottom-Right Inverted Index (180° Rotate) ── */}
      <div
        className={`flex flex-col items-center leading-none rotate-180 pointer-events-none z-10 self-end ${s.cornerGap}`}
        style={{ color }}
      >
        <span className={`${s.cornerIndex} leading-none tracking-tighter`}>{rankStr}</span>
        <SuitIcon suit={card.suit} size={s.cornerSuitSize} />
      </div>

      {/* ── Subtle Physical Satin Light Sheen ── */}
      <div
        className="absolute inset-0 rounded-[ inherit] pointer-events-none"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.05) 40%, transparent 100%)',
        }}
      />
    </div>
  );
};
