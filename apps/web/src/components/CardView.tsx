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

// ── Crisp Vector SVG Suit Pips ──
export const SuitIcon: React.FC<{ suit: string; className?: string; size?: number }> = ({
  suit,
  className = '',
  size = 14,
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

// ── Size Configuration ──
const SIZE_CONFIG = {
  sm: {
    card: 'w-9 h-[54px] rounded-[5px]',
    cornerRank: 'text-[9px] font-black tracking-tight',
    cornerSuitSize: 7,
    cornerGap: 'space-y-[0.5px]',
    innerPadding: 'p-[2px]',
    innerBorderInset: 'inset-[1.5px]',
    pipSize: 6.5,
    aceSize: 22,
  },
  md: {
    card: 'w-14 h-[84px] rounded-[7px]',
    cornerRank: 'text-[11px] font-black tracking-tight',
    cornerSuitSize: 9,
    cornerGap: 'space-y-0.5',
    innerPadding: 'p-1',
    innerBorderInset: 'inset-[2.5px]',
    pipSize: 9.5,
    aceSize: 34,
  },
  lg: {
    card: 'w-[72px] h-[106px] rounded-[9px]',
    cornerRank: 'text-sm font-black tracking-tight',
    cornerSuitSize: 12,
    cornerGap: 'space-y-0.5',
    innerPadding: 'p-1.5',
    innerBorderInset: 'inset-[3px]',
    pipSize: 13,
    aceSize: 44,
  },
};

// ── Traditional Playing Card Pip Coordinates [x%, y%, isFlipped?] ──
// Canonical layout matching real Bicycle / casino cards for ranks 2 through 10
const PIP_LAYOUTS: Record<number, [number, number, boolean?][]> = {
  2: [
    [50, 20],
    [50, 80, true],
  ],
  3: [
    [50, 20],
    [50, 50],
    [50, 80, true],
  ],
  4: [
    [32, 20],
    [68, 20],
    [32, 80, true],
    [68, 80, true],
  ],
  5: [
    [32, 20],
    [68, 20],
    [50, 50],
    [32, 80, true],
    [68, 80, true],
  ],
  6: [
    [32, 20],
    [68, 20],
    [32, 50],
    [68, 50],
    [32, 80, true],
    [68, 80, true],
  ],
  7: [
    [32, 20],
    [68, 20],
    [50, 35],
    [32, 50],
    [68, 50],
    [32, 80, true],
    [68, 80, true],
  ],
  8: [
    [32, 20],
    [68, 20],
    [50, 35],
    [32, 50],
    [68, 50],
    [50, 65, true],
    [32, 80, true],
    [68, 80, true],
  ],
  9: [
    [32, 18],
    [68, 18],
    [32, 38],
    [68, 38],
    [50, 50],
    [32, 62, true],
    [68, 62, true],
    [32, 82, true],
    [68, 82, true],
  ],
  10: [
    [32, 17],
    [68, 17],
    [50, 28],
    [32, 38],
    [68, 38],
    [32, 62, true],
    [68, 62, true],
    [50, 72, true],
    [32, 83, true],
    [68, 83, true],
  ],
};

// ── Grand Ornate Centerpieces for all 4 Aces ──
const OrnateAce: React.FC<{ suit: string; size: number }> = ({ suit, size }) => {
  switch (suit) {
    case 's':
      return (
        <svg
          viewBox="0 0 100 120"
          width={size}
          height={size * 1.2}
          fill="none"
          className="shrink-0 drop-shadow-sm"
        >
          {/* Grand Spade Silhouette */}
          <path
            d="M50 6 C44 24 16 50 16 72 C16 88 30 98 44 95 C46 94 47 92 48 90 C46 98 39 109 30 114 L70 114 C61 109 54 98 52 90 C53 92 54 94 56 95 C70 98 84 88 84 72 C84 50 56 24 50 6 Z"
            fill="#0f172a"
          />
          {/* Intricate Internal Filigree */}
          <path
            d="M50 24 C46 36 28 54 28 70 C28 80 37 86 46 84 C47 81 48 76 46 72 C43 66 38 60 42 54 C46 48 50 54 50 60 C50 54 54 48 58 54 C62 60 57 66 54 72 C52 76 53 81 54 84 C63 86 72 80 72 70 C72 54 54 36 50 24 Z"
            fill="#ffffff"
            opacity="0.9"
          />
          <circle cx="50" cy="64" r="4.5" fill="#0f172a" />
          <circle cx="42" cy="74" r="2.8" fill="#0f172a" />
          <circle cx="58" cy="74" r="2.8" fill="#0f172a" />
          <path d="M50 96 L47 110 L53 110 Z" fill="#ffffff" opacity="0.8" />
        </svg>
      );
    case 'h':
      return (
        <svg
          viewBox="0 0 100 100"
          width={size}
          height={size}
          fill="none"
          className="shrink-0 drop-shadow-sm"
        >
          {/* Grand Heart Silhouette */}
          <path
            d="M50 90 C22 66 10 48 10 32 C10 17 21 8 36 8 C44 8 48 12 50 16 C52 12 56 8 64 8 C79 8 90 17 90 32 C90 48 78 66 50 90 Z"
            fill="#dc2626"
          />
          {/* Intricate Internal Floral Filigree */}
          <path
            d="M50 80 C28 58 18 44 18 32 C18 22 26 15 36 15 C42 15 46 18 48 22 C44 28 40 38 46 46 C50 40 50 34 50 26 C50 34 50 40 54 46 C60 38 56 28 52 22 C54 18 58 15 64 15 C74 15 82 22 82 32 C82 44 72 58 50 80 Z"
            fill="#ffffff"
            opacity="0.9"
          />
          <circle cx="50" cy="50" r="4" fill="#dc2626" />
          <circle cx="38" cy="34" r="3" fill="#dc2626" />
          <circle cx="62" cy="34" r="3" fill="#dc2626" />
        </svg>
      );
    case 'd':
      return (
        <svg
          viewBox="0 0 100 100"
          width={size}
          height={size}
          fill="none"
          className="shrink-0 drop-shadow-sm"
        >
          {/* Grand Diamond Silhouette */}
          <path
            d="M50 6 C47 28 35 44 8 50 C35 56 47 72 50 94 C53 72 65 56 92 50 C65 44 53 28 50 6 Z"
            fill="#dc2626"
          />
          {/* Concentric Geometric Mandala Cutout */}
          <path
            d="M50 22 C48 36 40 46 22 50 C40 54 48 64 50 78 C52 64 60 54 78 50 C60 46 52 36 50 22 Z"
            fill="#ffffff"
            opacity="0.9"
          />
          <circle cx="50" cy="50" r="4.5" fill="#dc2626" />
          <circle cx="50" cy="35" r="2.2" fill="#dc2626" />
          <circle cx="50" cy="65" r="2.2" fill="#dc2626" />
          <circle cx="35" cy="50" r="2.2" fill="#dc2626" />
          <circle cx="65" cy="50" r="2.2" fill="#dc2626" />
        </svg>
      );
    case 'c':
      return (
        <svg
          viewBox="0 0 100 115"
          width={size}
          height={size * 1.15}
          fill="none"
          className="shrink-0 drop-shadow-sm"
        >
          {/* Grand Club Silhouette */}
          <path
            d="M50 10 C42 10 35 16 35 25 C35 31 39 36 44 38 C40 38 37 38 35 38 C24 38 16 46 16 57 C16 67 24 75 35 75 C39 75 43 73 46 70 C45 74 41 84 34 91 L66 91 C59 84 55 74 54 70 C57 73 61 75 65 75 C76 75 84 67 84 57 C84 46 76 38 65 38 C63 38 60 38 56 38 C61 36 65 31 65 25 C65 16 58 10 50 10 Z"
            fill="#0f172a"
          />
          {/* Trefoil Lace Cutout */}
          <circle cx="50" cy="25" r="8" fill="#ffffff" opacity="0.9" />
          <circle cx="34" cy="57" r="8" fill="#ffffff" opacity="0.9" />
          <circle cx="66" cy="57" r="8" fill="#ffffff" opacity="0.9" />
          <circle cx="50" cy="25" r="4" fill="#0f172a" />
          <circle cx="34" cy="57" r="4" fill="#0f172a" />
          <circle cx="66" cy="57" r="4" fill="#0f172a" />
          <circle cx="50" cy="50" r="4.5" fill="#ffffff" opacity="0.9" />
          <path d="M50 72 L47 88 L53 88 Z" fill="#ffffff" opacity="0.8" />
        </svg>
      );
    default:
      return null;
  }
};

// ── Reversible Court Card Artwork (Jack, Queen, King) ──
const CourtCardIllustration: React.FC<{
  rank: number;
  suit: string;
  isRed: boolean;
}> = ({ rank, suit, isRed }) => {
  const isKing = rank === 13;
  const isQueen = rank === 12;
  const isJack = rank === 11;

  const primaryColor = isRed ? '#dc2626' : '#1e3a8a';
  const goldColor = '#d97706';

  return (
    <div className="absolute inset-x-1.5 inset-y-2 flex flex-col items-center justify-center pointer-events-none select-none overflow-hidden rounded-[3px] border border-amber-900/20 bg-amber-50/50">
      <svg
        viewBox="0 0 100 130"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id={`goldGrad-${rank}-${suit}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
          <linearGradient id={`robeGrad-${rank}-${suit}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isRed ? '#f87171' : '#60a5fa'} />
            <stop offset="100%" stopColor={isRed ? '#991b1b' : '#1e3a8a'} />
          </linearGradient>
        </defs>

        {/* Diagonal Heraldic Divider Line */}
        <line
          x1="0"
          y1="130"
          x2="100"
          y2="0"
          stroke="rgba(217, 119, 6, 0.45)"
          strokeWidth="1.2"
          strokeDasharray="2,2"
        />

        {/* ── Top Half Portrait ── */}
        <g>
          {/* Robe / Mantle */}
          <path
            d="M 22 62 L 32 35 L 68 35 L 78 62 Z"
            fill={`url(#robeGrad-${rank}-${suit})`}
            stroke={goldColor}
            strokeWidth="1.2"
          />
          {/* Royal Sceptre / Medallion */}
          <circle
            cx="50"
            cy="46"
            r="4"
            fill={`url(#goldGrad-${rank}-${suit})`}
            stroke="#92400e"
            strokeWidth="0.8"
          />
          {/* Face */}
          <ellipse
            cx="50"
            cy="26"
            rx="10"
            ry="12"
            fill="#fffbeb"
            stroke="#78350f"
            strokeWidth="1.2"
          />
          {/* King Beard */}
          {isKing && (
            <path
              d="M 43 31 C 45 38 55 38 57 31 Z"
              fill="#78350f"
            />
          )}
          {/* Royal Crowns */}
          {isKing && (
            <path
              d="M 37 18 L 42 8 L 50 14 L 58 8 L 63 18 Z"
              fill={`url(#goldGrad-${rank}-${suit})`}
              stroke="#78350f"
              strokeWidth="1.2"
            />
          )}
          {isQueen && (
            <path
              d="M 38 18 C 38 11 62 11 62 18 L 64 18 L 50 10 L 36 18 Z"
              fill={`url(#goldGrad-${rank}-${suit})`}
              stroke="#78350f"
              strokeWidth="1.2"
            />
          )}
          {isJack && (
            <path
              d="M 37 18 C 40 9 60 9 63 18 Z"
              fill={isRed ? '#dc2626' : '#2563eb'}
              stroke={goldColor}
              strokeWidth="1.2"
            />
          )}
        </g>

        {/* ── Center Suit Crest Emblem ── */}
        <circle
          cx="50"
          cy="65"
          r="11"
          fill="#fffbeb"
          stroke="rgba(217,119,6,0.7)"
          strokeWidth="1.2"
        />

        {/* ── Bottom Half Inverted Portrait (180° Rotated) ── */}
        <g transform="rotate(180 50 65)">
          {/* Robe / Mantle */}
          <path
            d="M 22 62 L 32 35 L 68 35 L 78 62 Z"
            fill={`url(#robeGrad-${rank}-${suit})`}
            stroke={goldColor}
            strokeWidth="1.2"
          />
          <circle
            cx="50"
            cy="46"
            r="4"
            fill={`url(#goldGrad-${rank}-${suit})`}
            stroke="#92400e"
            strokeWidth="0.8"
          />
          <ellipse
            cx="50"
            cy="26"
            rx="10"
            ry="12"
            fill="#fffbeb"
            stroke="#78350f"
            strokeWidth="1.2"
          />
          {isKing && (
            <path
              d="M 43 31 C 45 38 55 38 57 31 Z"
              fill="#78350f"
            />
          )}
          {isKing && (
            <path
              d="M 37 18 L 42 8 L 50 14 L 58 8 L 63 18 Z"
              fill={`url(#goldGrad-${rank}-${suit})`}
              stroke="#78350f"
              strokeWidth="1.2"
            />
          )}
          {isQueen && (
            <path
              d="M 38 18 C 38 11 62 11 62 18 L 64 18 L 50 10 L 36 18 Z"
              fill={`url(#goldGrad-${rank}-${suit})`}
              stroke="#78350f"
              strokeWidth="1.2"
            />
          )}
          {isJack && (
            <path
              d="M 37 18 C 40 9 60 9 63 18 Z"
              fill={isRed ? '#dc2626' : '#2563eb'}
              stroke={goldColor}
              strokeWidth="1.2"
            />
          )}
        </g>
      </svg>

      {/* Embedded Suit in Center Crest */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ color: primaryColor }}
      >
        <SuitIcon suit={suit} size={15} />
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

  // ── Face-Down Card: Authentic Luxury Casino Card Back ──
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
        {/* 2.5px white border margin as seen on real casino decks */}
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
              width: size === 'sm' ? 20 : size === 'md' ? 34 : 46,
              height: size === 'sm' ? 20 : size === 'md' ? 34 : 46,
              background: 'radial-gradient(circle, #fef08a 0%, #d97706 60%, #78350f 100%)',
              border: '1.5px solid #fef3c7',
              boxShadow: '0 2px 6px rgba(0,0,0,0.7)',
            }}
          >
            <span
              className="font-serif font-black select-none text-zinc-950"
              style={{ fontSize: size === 'sm' ? 9 : size === 'md' ? 15 : 20 }}
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
  const color = isRed ? '#dc2626' : '#0f172a';
  const isAce = card.rank === 14;
  const isCourt = card.rank >= 11 && card.rank <= 13;
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
        background: '#ffffff',
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
        className={`absolute ${s.innerBorderInset} rounded-[3px] border border-zinc-300/40 pointer-events-none`}
      />

      {/* ── Top-Left Index (Rank + Miniature Suit) ── */}
      <div
        className={`flex flex-col items-center leading-none pointer-events-none z-10 ${s.cornerGap}`}
        style={{ color }}
      >
        <span className={`${s.cornerRank} leading-none tracking-tighter`}>{rankStr}</span>
        <SuitIcon suit={card.suit} size={s.cornerSuitSize} />
      </div>

      {/* ── Card Center: Authentic Deck Layouts (Matching Reference Image) ── */}
      {isAce ? (
        /* Grand Ornate Ace Centerpiece for all 4 suits */
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <OrnateAce suit={card.suit} size={s.aceSize} />
        </div>
      ) : isCourt ? (
        /* Reversible Royal Court Card Portrait (J, Q, K) */
        <CourtCardIllustration rank={card.rank} suit={card.suit} isRed={isRed} />
      ) : isNumbered ? (
        /* Traditional Physical Card Pip Arrangements (2 through 10) - ALWAYS rendered on all sizes */
        <div className="absolute inset-x-1.5 inset-y-2 pointer-events-none select-none">
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
      ) : null}

      {/* ── Bottom-Right Inverted Index (180° Rotated) ── */}
      <div
        className={`flex flex-col items-center leading-none rotate-180 pointer-events-none z-10 self-end ${s.cornerGap}`}
        style={{ color }}
      >
        <span className={`${s.cornerRank} leading-none tracking-tighter`}>{rankStr}</span>
        <SuitIcon suit={card.suit} size={s.cornerSuitSize} />
      </div>

      {/* ── Subtle Physical Satin Light Sheen ── */}
      <div
        className="absolute inset-0 rounded-[inherit] pointer-events-none"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.05) 40%, transparent 100%)',
        }}
      />
    </div>
  );
};
