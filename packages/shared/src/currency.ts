/**
 * Utility for Indian Rupee (₹) virtual chip currency formatting.
 * Strictly integer accounting, non-monetary virtual game credits.
 */

export const VIRTUAL_CURRENCY_SYMBOL = '₹';
export const VIRTUAL_CURRENCY_DISCLAIMER =
  '₹ values are virtual game credits and have no real-world monetary value.';

/**
 * Formats integer virtual chips using the standard Indian numbering system.
 * Examples:
 *   formatRupee(50) -> "₹50"
 *   formatRupee(1000) -> "₹1,000"
 *   formatRupee(12500) -> "₹12,500"
 *   formatRupee(100000) -> "₹1,00,000"
 *   formatRupee(1000000) -> "₹10,00,000"
 */
export function formatRupee(amount: number, prefix: string = VIRTUAL_CURRENCY_SYMBOL): string {
  const isNegative = amount < 0;
  const abs = Math.abs(Math.round(amount));
  const formatted = abs.toLocaleString('en-IN');
  return `${isNegative ? '-' : ''}${prefix}${formatted}`;
}

/**
 * Validates whether starting stack and blinds are sensible integers.
 */
export function validateVirtualEconomyConfig(
  startingChips: number,
  smallBlind: number,
  bigBlind: number
): { valid: boolean; error?: string } {
  if (!Number.isInteger(startingChips) || startingChips < 0 || startingChips > 100_000_000) {
    return { valid: false, error: 'Starting stack must be an integer of at least ₹0' };
  }
  if (!Number.isInteger(smallBlind) || smallBlind < 1) {
    return { valid: false, error: 'Small blind must be an integer of at least ₹1' };
  }
  if (!Number.isInteger(bigBlind) || bigBlind <= smallBlind) {
    return { valid: false, error: 'Big blind must be greater than small blind' };
  }
  if (startingChips > 0 && bigBlind > startingChips) {
    return { valid: false, error: 'Big blind cannot exceed the configured starting stack' };
  }
  return { valid: true };
}
