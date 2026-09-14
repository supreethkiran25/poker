import type { ActionType, LegalAction } from '@poker/shared';

export interface BettingPlayerState {
  playerId: string;
  chips: number;
  currentBet: number;
  totalContributed: number;
  hasFolded: boolean;
  isAllIn: boolean;
  hasActedInRound: boolean;
}

export interface BettingRoundState {
  currentTableBet: number;
  minRaise: number;
  lastRaiseDiff: number;
  pot: number;
  players: BettingPlayerState[];
}

export function getLegalActions(
  player: BettingPlayerState,
  tableBet: number,
  minRaise: number,
  bigBlind: number
): LegalAction[] {
  if (player.hasFolded || player.isAllIn || player.chips <= 0) {
    return [];
  }

  const actions: LegalAction[] = [];
  const toCall = tableBet - player.currentBet;

  // Fold is always an option
  actions.push({ type: 'fold' });

  // Check or Call
  if (toCall === 0) {
    actions.push({ type: 'check' });
  } else {
    actions.push({
      type: 'call',
      minAmount: Math.min(player.chips, toCall),
      maxAmount: Math.min(player.chips, toCall),
    });
  }

  // Bet (when table bet is 0)
  if (tableBet === 0) {
    const minBet = Math.min(player.chips, bigBlind);
    actions.push({
      type: 'bet',
      minAmount: minBet,
      maxAmount: player.chips,
    });
  } else {
    // Raise (when table bet > 0)
    // A player can only raise if they have enough chips to raise to at least minRaise,
    // OR if their remaining chips put them all-in for more than the current bet.
    const playerTotalPotential = player.currentBet + player.chips;
    if (playerTotalPotential > tableBet) {
      const actualMinRaise = Math.min(playerTotalPotential, minRaise);
      actions.push({
        type: 'raise',
        minAmount: actualMinRaise,
        maxAmount: playerTotalPotential,
      });
    }
  }

  // All-in is always available
  if (player.chips > 0) {
    actions.push({
      type: 'all-in',
      minAmount: player.currentBet + player.chips,
      maxAmount: player.currentBet + player.chips,
    });
  }

  return actions;
}

export function validateAction(
  player: BettingPlayerState,
  action: { type: ActionType; amount?: number },
  tableBet: number,
  minRaise: number,
  bigBlind: number
): { valid: boolean; error?: string; effectiveAmount?: number } {
  const legal = getLegalActions(player, tableBet, minRaise, bigBlind);
  const found = legal.find((a) => a.type === action.type);

  if (!found) {
    return { valid: false, error: `Action '${action.type}' is not legal in current state` };
  }

  const toCall = tableBet - player.currentBet;

  switch (action.type) {
    case 'fold':
      return { valid: true, effectiveAmount: 0 };

    case 'check':
      if (toCall !== 0) {
        return { valid: false, error: 'Cannot check when there is a bet to call' };
      }
      return { valid: true, effectiveAmount: 0 };

    case 'call': {
      const callAmount = Math.min(player.chips, toCall);
      return { valid: true, effectiveAmount: callAmount };
    }

    case 'bet': {
      const amount = action.amount;
      if (amount === undefined || amount < (found.minAmount ?? bigBlind)) {
        return { valid: false, error: `Bet amount must be at least ${found.minAmount}` };
      }
      if (amount > player.chips) {
        return { valid: false, error: 'Cannot bet more chips than available' };
      }
      return { valid: true, effectiveAmount: amount };
    }

    case 'raise': {
      const targetTotal = action.amount;
      if (targetTotal === undefined) {
        return { valid: false, error: 'Raise target amount is required' };
      }
      const playerTotalPotential = player.currentBet + player.chips;
      if (targetTotal > playerTotalPotential) {
        return { valid: false, error: 'Cannot raise above player chip total' };
      }
      if (targetTotal < (found.minAmount ?? minRaise) && targetTotal < playerTotalPotential) {
        return { valid: false, error: `Raise must be to at least ${found.minAmount}` };
      }
      const additionalChips = targetTotal - player.currentBet;
      return { valid: true, effectiveAmount: additionalChips };
    }

    case 'all-in': {
      return { valid: true, effectiveAmount: player.chips };
    }

    default:
      return { valid: false, error: 'Unknown action type' };
  }
}

/**
 * Checks if the betting round is complete.
 */
export function isBettingRoundComplete(players: BettingPlayerState[]): boolean {
  const nonFolded = players.filter((p) => !p.hasFolded);

  // If 1 or 0 players remain, the hand is complete
  if (nonFolded.length <= 1) {
    return true;
  }

  // Players who can still make decisions (not all-in)
  const canActPlayers = nonFolded.filter((p) => !p.isAllIn && p.chips > 0);

  // If 0 or 1 players can act, check if any pending calls remain
  if (canActPlayers.length === 0) {
    return true; // All remaining active players are all-in
  }

  const highestBet = Math.max(...nonFolded.map((p) => p.currentBet));

  // If 1 player can act and everyone else is all-in or folded,
  // round is complete once that player has either acted or matched the highest bet
  if (canActPlayers.length === 1) {
    const single = canActPlayers[0];
    if (single.hasActedInRound && single.currentBet >= highestBet) {
      return true;
    }
  }

  // All players who can act must have acted at least once AND their bet must match the highest bet
  const allActedAndMatched = canActPlayers.every(
    (p) => p.hasActedInRound && p.currentBet === highestBet
  );

  return allActedAndMatched;
}
