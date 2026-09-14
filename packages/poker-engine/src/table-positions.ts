export interface SeatInfo {
  seatIndex: number;
  playerId: string;
  hasFolded: boolean;
  isAllIn: boolean;
  chips: number;
}

/**
 * Finds the next occupied seat index clockwise from a given seat.
 */
export function getNextOccupiedSeat(
  seats: (SeatInfo | null)[],
  fromSeat: number
): number {
  const numSeats = seats.length;
  for (let i = 1; i <= numSeats; i++) {
    const nextIdx = (fromSeat + i) % numSeats;
    if (seats[nextIdx] !== null) {
      return nextIdx;
    }
  }
  return fromSeat;
}

/**
 * Finds the next active (can act: not folded, not all-in, has chips) player seat clockwise.
 */
export function getNextActiveSeat(
  seats: (SeatInfo | null)[],
  fromSeat: number
): number | null {
  const numSeats = seats.length;
  for (let i = 1; i <= numSeats; i++) {
    const nextIdx = (fromSeat + i) % numSeats;
    const seat = seats[nextIdx];
    if (seat !== null && !seat.hasFolded && !seat.isAllIn && seat.chips > 0) {
      return nextIdx;
    }
  }
  return null;
}

export interface HandPositions {
  dealerSeat: number;
  smallBlindSeat: number;
  bigBlindSeat: number;
  firstToActPreflop: number;
  firstToActPostflop: number;
}

/**
 * Calculates button, blinds, and starting action positions for a hand.
 */
export function determinePositions(
  seats: (SeatInfo | null)[],
  previousDealerSeat: number = -1
): HandPositions {
  const occupiedSeats = seats
    .map((s, idx) => (s !== null && s.chips > 0 ? idx : -1))
    .filter((idx) => idx !== -1);

  if (occupiedSeats.length < 2) {
    throw new Error('Need at least 2 players with chips to determine positions');
  }

  // Next dealer seat
  let dealerSeat: number;
  if (previousDealerSeat === -1) {
    dealerSeat = occupiedSeats[0];
  } else {
    dealerSeat = getNextOccupiedSeat(seats, previousDealerSeat);
  }

  // Heads-up rules (exactly 2 players)
  if (occupiedSeats.length === 2) {
    const otherSeat = occupiedSeats.find((s) => s !== dealerSeat)!;
    const smallBlindSeat = dealerSeat; // In Heads-up, dealer is SB
    const bigBlindSeat = otherSeat;
    // Preflop: Dealer (SB) acts first
    const firstToActPreflop = dealerSeat;
    // Postflop: BB acts first
    const firstToActPostflop = bigBlindSeat;

    return {
      dealerSeat,
      smallBlindSeat,
      bigBlindSeat,
      firstToActPreflop,
      firstToActPostflop,
    };
  }

  // 3+ players rules
  const smallBlindSeat = getNextOccupiedSeat(seats, dealerSeat);
  const bigBlindSeat = getNextOccupiedSeat(seats, smallBlindSeat);
  const firstToActPreflop = getNextOccupiedSeat(seats, bigBlindSeat);
  const firstToActPostflop = getNextOccupiedSeat(seats, dealerSeat);

  return {
    dealerSeat,
    smallBlindSeat,
    bigBlindSeat,
    firstToActPreflop,
    firstToActPostflop,
  };
}
