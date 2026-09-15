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

// ── Crisp Clean Vector SVG Suit Pips Matching Standard Bicycle / USPCC Cards ──
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
          <path d="M50 88 C20 64 8 46 8 30 C8 15 19 6 34 6 C43 6 47 10 50 15 C53 10 57 6 66 6 C81 6 92 15 92 30 C92 46 80 64 50 88 Z" />
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
          <path d="M50 8 L88 50 L50 92 L12 50 Z" />
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
          <path d="M50 12 C41 12 34 18 34 27 C34 33 38 38 43 40 C39 40 36 40 34 40 C23 40 15 48 15 59 C15 69 23 77 34 77 C39 77 43 75 46 72 C45 76 41 86 33 93 L67 93 C59 86 55 76 54 72 C57 75 61 77 66 77 C77 77 85 69 85 59 C85 48 77 40 66 40 C64 40 61 40 57 40 C62 38 66 33 66 27 C66 18 59 12 50 12 Z" />
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
    card: 'w-9 h-[54px] rounded-[4px]',
    cornerRank: 'text-[9px] font-black tracking-tighter',
    cornerSuitSize: 6.5,
    pipSize: 5.5,
    aceSize: 15,
    innerBoxInsets: 'inset-x-[8px] inset-y-[3.5px]',
  },
  md: {
    card: 'w-14 h-[84px] rounded-[6px]',
    cornerRank: 'text-[12px] font-black tracking-tighter',
    cornerSuitSize: 9,
    pipSize: 8.5,
    aceSize: 22,
    innerBoxInsets: 'inset-x-[12px] inset-y-[5.5px]',
  },
  lg: {
    card: 'w-[72px] h-[106px] rounded-[7px]',
    cornerRank: 'text-sm font-black tracking-tighter',
    cornerSuitSize: 12,
    pipSize: 11,
    aceSize: 28,
    innerBoxInsets: 'inset-x-[16px] inset-y-[7px]',
  },
};

// ── Traditional Playing Card Pip Coordinates [x%, y%, isFlipped?] ──
// Canonical layouts strictly contained within the inner bounding box (as seen on real playing cards)
const PIP_LAYOUTS: Record<number, [number, number, boolean?][]> = {
  2: [
    [50, 22],
    [50, 78, true],
  ],
  3: [
    [50, 20],
    [50, 50],
    [50, 80, true],
  ],
  4: [
    [28, 22],
    [72, 22],
    [28, 78, true],
    [72, 78, true],
  ],
  5: [
    [28, 22],
    [72, 22],
    [50, 50],
    [28, 78, true],
    [72, 78, true],
  ],
  6: [
    [28, 22],
    [72, 22],
    [28, 50],
    [72, 50],
    [28, 78, true],
    [72, 78, true],
  ],
  7: [
    [28, 20],
    [72, 20],
    [50, 35],
    [28, 50],
    [72, 50],
    [28, 80, true],
    [72, 80, true],
  ],
  8: [
    [28, 19],
    [72, 19],
    [50, 34],
    [28, 49],
    [72, 49],
    [50, 65, true],
    [28, 81, true],
    [72, 81, true],
  ],
  9: [
    [28, 17],
    [72, 17],
    [28, 38],
    [72, 38],
    [50, 50],
    [28, 62, true],
    [72, 62, true],
    [28, 83, true],
    [72, 83, true],
  ],
  10: [
    [28, 16],
    [72, 16],
    [50, 28],
    [28, 39],
    [72, 39],
    [28, 61, true],
    [72, 61, true],
    [50, 72, true],
    [28, 84, true],
    [72, 84, true],
  ],
};

// ── Authentic Reversible Court Card Artwork (Jack, Queen, King) ──
const CourtCardIllustration: React.FC<{
  rank: number;
  suit: string;
  isRed: boolean;
}> = ({ rank, suit, isRed }) => {
  const isKing = rank === 13;
  const isQueen = rank === 12;
  const isJack = rank === 11;

  const robeColor = isRed ? '#dc2626' : '#1e3a8a';
  const secondaryRobe = isRed ? '#991b1b' : '#172554';
  const accentColor = '#f59e0b';
  const trimColor = '#fbbf24';
  const skinColor = '#fef3c7';
  const hairColor = isQueen ? '#f59e0b' : '#78350f';
  const lineDark = '#0f172a';

  return (
    <svg
      viewBox="0 0 100 135"
      className="w-full h-full select-none pointer-events-none"
      preserveAspectRatio="none"
    >
      <rect width="100" height="135" fill="#fafaf9" />

      {/* Subtle center hairline divider */}
      <line x1="0" y1="67.5" x2="100" y2="67.5" stroke="#d4d4d8" strokeWidth="0.8" />

      {/* ── TOP HALF PORTRAIT ── */}
      <g>
        {/* Mantle / Shoulders */}
        <path
          d="M 12 67.5 L 22 42 L 78 42 L 88 67.5 Z"
          fill={robeColor}
          stroke={lineDark}
          strokeWidth="1.2"
        />
        <path
          d="M 28 42 L 38 67.5 L 62 67.5 L 72 42 Z"
          fill={secondaryRobe}
          stroke={accentColor}
          strokeWidth="1"
        />
        {/* Ermine Collar */}
        <path
          d="M 30 42 C 35 48 65 48 70 42 L 65 37 L 35 37 Z"
          fill="#ffffff"
          stroke={lineDark}
          strokeWidth="1"
        />
        <circle cx="42" cy="42" r="1.2" fill={lineDark} />
        <circle cx="50" cy="43" r="1.2" fill={lineDark} />
        <circle cx="58" cy="42" r="1.2" fill={lineDark} />

        {/* Neck & Face */}
        <rect x="44" y="32" width="12" height="8" fill={skinColor} stroke={lineDark} strokeWidth="1" />
        <ellipse cx="50" cy="25" rx="11" ry="12" fill={skinColor} stroke={lineDark} strokeWidth="1.2" />

        {/* Hair */}
        <path
          d="M 39 24 C 37 32 38 38 42 38 C 40 34 40 28 42 24 Z"
          fill={hairColor}
          stroke={lineDark}
          strokeWidth="0.8"
        />
        <path
          d="M 61 24 C 63 32 62 38 58 38 C 60 34 60 28 58 24 Z"
          fill={hairColor}
          stroke={lineDark}
          strokeWidth="0.8"
        />

        {/* Eyes, Nose, Mouth */}
        <ellipse cx="46" cy="23" rx="1.2" ry="1" fill={lineDark} />
        <ellipse cx="54" cy="23" rx="1.2" ry="1" fill={lineDark} />
        <path d="M 50 23 L 49 27 L 51 27" stroke={lineDark} strokeWidth="0.8" fill="none" />
        <line x1="48" y1="29" x2="52" y2="29" stroke="#b91c1c" strokeWidth="0.9" />

        {/* King Beard & Mustache */}
        {isKing && (
          <>
            <path
              d="M 46 28 C 48 31 52 31 54 28"
              stroke="#78350f"
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M 45 31 C 48 37 52 37 55 31 Z"
              fill="#78350f"
              stroke={lineDark}
              strokeWidth="0.8"
            />
          </>
        )}

        {/* King Crown */}
        {isKing && (
          <path
            d="M 37 16 L 40 7 L 46 12 L 50 5 L 54 12 L 60 7 L 63 16 Z"
            fill={accentColor}
            stroke={lineDark}
            strokeWidth="1.2"
          />
        )}

        {/* Queen Crown & Royal Veil */}
        {isQueen && (
          <>
            <path
              d="M 37 16 C 35 30 32 45 30 55"
              stroke="#e2e8f0"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M 63 16 C 65 30 68 45 70 55"
              stroke="#e2e8f0"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M 38 16 L 42 9 L 50 13 L 58 9 L 62 16 Z"
              fill={trimColor}
              stroke={lineDark}
              strokeWidth="1.2"
            />
          </>
        )}

        {/* Jack Tudor Cap */}
        {isJack && (
          <path
            d="M 37 17 C 38 8 62 8 63 17 Z"
            fill={secondaryRobe}
            stroke={lineDark}
            strokeWidth="1.2"
          />
        )}

        {/* Sceptre / Sword / Flower held in hand */}
        {isKing && (
          <path d="M 76 38 L 76 60 M 73 42 L 79 42" stroke={accentColor} strokeWidth="2" strokeLinecap="round" />
        )}
        {isQueen && (
          <circle cx="76" cy="50" r="3.5" fill="#dc2626" stroke={accentColor} strokeWidth="1" />
        )}
        {isJack && (
          <path d="M 76 35 L 76 62 M 72 38 L 80 38" stroke="#94a3b8" strokeWidth="2" strokeLinecap="square" />
        )}
      </g>

      {/* ── BOTTOM HALF PORTRAIT (180° Rotated) ── */}
      <g transform="rotate(180 50 67.5)">
        <path
          d="M 12 67.5 L 22 42 L 78 42 L 88 67.5 Z"
          fill={robeColor}
          stroke={lineDark}
          strokeWidth="1.2"
        />
        <path
          d="M 28 42 L 38 67.5 L 62 67.5 L 72 42 Z"
          fill={secondaryRobe}
          stroke={accentColor}
          strokeWidth="1"
        />
        <path
          d="M 30 42 C 35 48 65 48 70 42 L 65 37 L 35 37 Z"
          fill="#ffffff"
          stroke={lineDark}
          strokeWidth="1"
        />
        <circle cx="42" cy="42" r="1.2" fill={lineDark} />
        <circle cx="50" cy="43" r="1.2" fill={lineDark} />
        <circle cx="58" cy="42" r="1.2" fill={lineDark} />

        <rect x="44" y="32" width="12" height="8" fill={skinColor} stroke={lineDark} strokeWidth="1" />
        <ellipse cx="50" cy="25" rx="11" ry="12" fill={skinColor} stroke={lineDark} strokeWidth="1.2" />

        <path
          d="M 39 24 C 37 32 38 38 42 38 C 40 34 40 28 42 24 Z"
          fill={hairColor}
          stroke={lineDark}
          strokeWidth="0.8"
        />
        <path
          d="M 61 24 C 63 32 62 38 58 38 C 60 34 60 28 58 24 Z"
          fill={hairColor}
          stroke={lineDark}
          strokeWidth="0.8"
        />

        <ellipse cx="46" cy="23" rx="1.2" ry="1" fill={lineDark} />
        <ellipse cx="54" cy="23" rx="1.2" ry="1" fill={lineDark} />
        <path d="M 50 23 L 49 27 L 51 27" stroke={lineDark} strokeWidth="0.8" fill="none" />
        <line x1="48" y1="29" x2="52" y2="29" stroke="#b91c1c" strokeWidth="0.9" />

        {isKing && (
          <>
            <path
              d="M 46 28 C 48 31 52 31 54 28"
              stroke="#78350f"
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M 45 31 C 48 37 52 37 55 31 Z"
              fill="#78350f"
              stroke={lineDark}
              strokeWidth="0.8"
            />
          </>
        )}

        {isKing && (
          <path
            d="M 37 16 L 40 7 L 46 12 L 50 5 L 54 12 L 60 7 L 63 16 Z"
            fill={accentColor}
            stroke={lineDark}
            strokeWidth="1.2"
          />
        )}

        {isQueen && (
          <>
            <path
              d="M 37 16 C 35 30 32 45 30 55"
              stroke="#e2e8f0"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M 63 16 C 65 30 68 45 70 55"
              stroke="#e2e8f0"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M 38 16 L 42 9 L 50 13 L 58 9 L 62 16 Z"
              fill={trimColor}
              stroke={lineDark}
              strokeWidth="1.2"
            />
          </>
        )}

        {isJack && (
          <path
            d="M 37 17 C 38 8 62 8 63 17 Z"
            fill={secondaryRobe}
            stroke={lineDark}
            strokeWidth="1.2"
          />
        )}

        {isKing && (
          <path d="M 76 38 L 76 60 M 73 42 L 79 42" stroke={accentColor} strokeWidth="2" strokeLinecap="round" />
        )}
        {isQueen && (
          <circle cx="76" cy="50" r="3.5" fill="#dc2626" stroke={accentColor} strokeWidth="1" />
        )}
        {isJack && (
          <path d="M 76 35 L 76 62 M 72 38 L 80 38" stroke="#94a3b8" strokeWidth="2" strokeLinecap="square" />
        )}
      </g>

      {/* ── CENTER HERALDIC SUIT BADGE ── */}
      <circle cx="50" cy="67.5" r="9.5" fill="#ffffff" stroke={accentColor} strokeWidth="1.5" />
      <g transform="translate(43.5, 61)" style={{ color: isRed ? '#dc2626' : '#0f172a' }}>
        <SuitIcon suit={suit} size={13} />
      </g>
    </svg>
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
        {/* 2px white border margin as seen on real casino decks */}
        <div
          className="absolute inset-[2px] rounded-[3px] overflow-hidden flex items-center justify-center"
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
              width: size === 'sm' ? 18 : size === 'md' ? 30 : 42,
              height: size === 'sm' ? 18 : size === 'md' ? 30 : 42,
              background: 'radial-gradient(circle, #fef08a 0%, #d97706 60%, #78350f 100%)',
              border: '1.5px solid #fef3c7',
              boxShadow: '0 2px 6px rgba(0,0,0,0.7)',
            }}
          >
            <span
              className="font-serif font-black select-none text-zinc-950"
              style={{ fontSize: size === 'sm' ? 9 : size === 'md' ? 14 : 19 }}
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
      className={`${s.card} relative select-none realistic-card-shadow card-cinematic-deal ${
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
          : '0 3px 8px -1px rgba(0,0,0,0.35), 0 1px 3px rgba(0,0,0,0.2), inset 0 0 0 1px rgba(255,255,255,0.85)',
      }}
    >
      {/* ── Top-Left Index (Rank + Miniature Suit) ── */}
      <div
        className="absolute top-[2px] left-[2px] sm:top-[3px] sm:left-[3px] flex flex-col items-center leading-none pointer-events-none z-20"
        style={{ color }}
      >
        <span className={`${s.cornerRank} leading-none text-center`}>{rankStr}</span>
        <div className="mt-[1px]">
          <SuitIcon suit={card.suit} size={s.cornerSuitSize} />
        </div>
      </div>

      {/* ── Authentic Inner Frame Box (as in reference deck image) ── */}
      <div
        className={`absolute ${s.innerBoxInsets} rounded-[2px] border border-zinc-700/60 pointer-events-none select-none overflow-hidden bg-white`}
      >
        {isAce ? (
          /* Single classic pip in the center of the inner box */
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ color }}
          >
            <SuitIcon suit={card.suit} size={s.aceSize} />
          </div>
        ) : isCourt ? (
          /* Reversible classic court card portrait (J, Q, K) */
          <CourtCardIllustration rank={card.rank} suit={card.suit} isRed={isRed} />
        ) : isNumbered ? (
          /* Canonical pip layouts strictly inside the inner box */
          <div className="relative w-full h-full pointer-events-none">
            {PIP_LAYOUTS[card.rank]?.map(([x, y, isFlipped], idx) => (
              <div
                key={idx}
                className="absolute flex items-center justify-center"
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
      </div>

      {/* ── Bottom-Right Inverted Index (180° Rotated) ── */}
      <div
        className="absolute bottom-[2px] right-[2px] sm:bottom-[3px] sm:right-[3px] flex flex-col items-center leading-none rotate-180 pointer-events-none z-20"
        style={{ color }}
      >
        <span className={`${s.cornerRank} leading-none text-center`}>{rankStr}</span>
        <div className="mt-[1px]">
          <SuitIcon suit={card.suit} size={s.cornerSuitSize} />
        </div>
      </div>

      {/* ── Subtle Physical Card Sheen ── */}
      <div
        className="absolute inset-0 rounded-[inherit] pointer-events-none"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.02) 40%, transparent 100%)',
        }}
      />
    </div>
  );
};
