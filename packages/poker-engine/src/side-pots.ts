import type { SidePot } from '@poker/shared';

export interface PlayerContribution {
  playerId: string;
  totalContributed: number;
  hasFolded: boolean;
  isAllIn: boolean;
}

export interface PotPayout {
  potIndex: number;
  amount: number;
  eligiblePlayerIds: string[];
  winners: {
    playerId: string;
    amount: number;
  }[];
}

/**
 * Calculates main pot and side pots based on player contributions.
 * Correctly refunds uncalled bets.
 */
export function calculatePots(contributions: PlayerContribution[]): {
  pots: SidePot[];
  refunds: { playerId: string; amount: number }[];
} {
  const refunds: { playerId: string; amount: number }[] = [];
  const players = contributions.map((p) => ({
    ...p,
    remaining: p.totalContributed,
  }));

  // Check for uncalled bet:
  // If the highest contribution among non-folded players is strictly greater than the second highest contribution,
  // the difference is an uncalled bet that must be refunded.
  const nonFolded = players.filter((p) => !p.hasFolded && p.remaining > 0);
  if (nonFolded.length > 0) {
    nonFolded.sort((a, b) => b.remaining - a.remaining);
    const highest = nonFolded[0];
    const secondHighestRemaining = nonFolded.length > 1 ? nonFolded[1].remaining : 0;
    
    // Also consider folded players who might have contributed more than the second highest
    const highestOther = players
      .filter((p) => p.playerId !== highest.playerId && p.remaining > 0)
      .reduce((max, p) => Math.max(max, p.remaining), 0);

    const matchLimit = Math.max(secondHighestRemaining, highestOther);
    if (highest.remaining > matchLimit) {
      const refundAmount = highest.remaining - matchLimit;
      highest.remaining -= refundAmount;
      refunds.push({ playerId: highest.playerId, amount: refundAmount });
    }
  }

  const pots: SidePot[] = [];

  while (true) {
    const activeContributors = players.filter((p) => p.remaining > 0);
    if (activeContributors.length === 0) {
      break;
    }

    // Find the minimum positive contribution among active ALL-IN players (or non-folded if none are all-in)
    const activeAllIns = activeContributors.filter((p) => p.isAllIn && !p.hasFolded);
    let sliceAmount: number;

    if (activeAllIns.length > 0) {
      sliceAmount = Math.min(...activeAllIns.map((p) => p.remaining));
    } else {
      // No more all-in caps, take the minimum of remaining active contributors
      sliceAmount = Math.min(...activeContributors.map((p) => p.remaining));
    }

    let potAmount = 0;
    const eligiblePlayers: string[] = [];

    for (const p of players) {
      if (p.remaining > 0) {
        const take = Math.min(p.remaining, sliceAmount);
        potAmount += take;
        p.remaining -= take;

        if (!p.hasFolded && !eligiblePlayers.includes(p.playerId)) {
          eligiblePlayers.push(p.playerId);
        }
      }
    }

    if (potAmount > 0 && eligiblePlayers.length > 0) {
      // Check if we can merge with the previous pot (if eligible players are identical)
      if (
        pots.length > 0 &&
        pots[pots.length - 1].eligiblePlayerIds.length === eligiblePlayers.length &&
        pots[pots.length - 1].eligiblePlayerIds.every((id) => eligiblePlayers.includes(id))
      ) {
        pots[pots.length - 1].amount += potAmount;
      } else {
        pots.push({
          amount: potAmount,
          eligiblePlayerIds: eligiblePlayers,
        });
      }
    } else if (potAmount > 0 && eligiblePlayers.length === 0) {
      // In the rare case where dead money was in the pot with no eligible players,
      // distribute to last pot or first active
      if (pots.length > 0) {
        pots[pots.length - 1].amount += potAmount;
      }
    }
  }

  return { pots, refunds };
}

/**
 * Distributes pots among winners based on hand comparisons.
 * Supports split pots and odd-chip assignment.
 */
export function distributePots(
  pots: SidePot[],
  evaluations: Map<string, { category: number; ranks: number[] }>
): PotPayout[] {
  const payouts: PotPayout[] = [];

  for (let potIdx = 0; potIdx < pots.length; potIdx++) {
    const pot = pots[potIdx];
    const eligible = pot.eligiblePlayerIds.filter((id) => evaluations.has(id));

    if (eligible.length === 0) {
      continue;
    }

    // Find best hand among eligible
    let bestScore: { category: number; ranks: number[] } | null = null;
    let potWinners: string[] = [];

    for (const pid of eligible) {
      const score = evaluations.get(pid)!;
      if (!bestScore) {
        bestScore = score;
        potWinners = [pid];
      } else {
        // Compare
        let cmp = score.category - bestScore.category;
        if (cmp === 0) {
          const len = Math.max(score.ranks.length, bestScore.ranks.length);
          for (let i = 0; i < len; i++) {
            const rA = score.ranks[i] ?? 0;
            const rB = bestScore.ranks[i] ?? 0;
            if (rA !== rB) {
              cmp = rA - rB;
              break;
            }
          }
        }

        if (cmp > 0) {
          bestScore = score;
          potWinners = [pid];
        } else if (cmp === 0) {
          potWinners.push(pid);
        }
      }
    }

    // Split pot
    const share = Math.floor(pot.amount / potWinners.length);
    let remainder = pot.amount % potWinners.length;

    const winnerPayouts = potWinners.map((pid) => {
      let winAmount = share;
      if (remainder > 0) {
        winAmount += 1;
        remainder -= 1;
      }
      return { playerId: pid, amount: winAmount };
    });

    payouts.push({
      potIndex: potIdx,
      amount: pot.amount,
      eligiblePlayerIds: pot.eligiblePlayerIds,
      winners: winnerPayouts,
    });
  }

  return payouts;
}
