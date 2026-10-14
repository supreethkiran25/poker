import { useState, useEffect } from 'react';

const WALLET_KEY = 'poker_account_coins';
const WELCOME_SEEN_KEY = 'poker_welcome_100k_seen';
const DEVICE_ID_KEY = 'poker_device_id';
const DEVICE_100K_KEY = 'poker_device_100k_granted';
export const DEFAULT_WELCOME_COINS = 100000; // ₹1,00,000 Free Coins for every device

/**
 * Returns a persistent unique Device ID for the client device.
 * Generated once per device/browser and stored in localStorage.
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined' || !window.localStorage) {
    return 'device_ssr_fallback';
  }
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    const randomPart =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    deviceId = `dev_${randomPart}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

/**
 * Get current user account balance.
 * Ensures every unique device is granted ₹1,00,000 coins!
 * If a device has not yet received its ₹1,00,000 grant, it is credited immediately.
 */
export function getAccountCoins(): number {
  if (typeof window === 'undefined' || !window.localStorage) {
    return DEFAULT_WELCOME_COINS;
  }

  // Ensure persistent device ID is registered
  getDeviceId();

  const deviceGranted = localStorage.getItem(DEVICE_100K_KEY);
  const stored = localStorage.getItem(WALLET_KEY);

  // If this device hasn't received its 100k grant yet:
  if (!deviceGranted) {
    const existingCoins = stored !== null && !isNaN(Number(stored)) ? parseInt(stored, 10) : 0;
    // Guarantee at least 100,000 coins on this device
    const finalCoins = Math.max(DEFAULT_WELCOME_COINS, existingCoins);
    localStorage.setItem(WALLET_KEY, String(finalCoins));
    localStorage.setItem(DEVICE_100K_KEY, 'true');
    if (!localStorage.getItem(WELCOME_SEEN_KEY)) {
      localStorage.setItem(WELCOME_SEEN_KEY, 'false');
    }
    return finalCoins;
  }

  if (stored === null || isNaN(Number(stored))) {
    localStorage.setItem(WALLET_KEY, String(DEFAULT_WELCOME_COINS));
    localStorage.setItem(DEVICE_100K_KEY, 'true');
    localStorage.setItem(WELCOME_SEEN_KEY, 'false');
    return DEFAULT_WELCOME_COINS;
  }

  return Math.max(0, parseInt(stored, 10));
}

/**
 * Add won coins or chips to user's account balance
 */
export function addAccountCoins(amount: number): number {
  if (amount <= 0 || typeof window === 'undefined') return getAccountCoins();

  const current = getAccountCoins();
  const updated = current + Math.round(amount);
  localStorage.setItem(WALLET_KEY, String(updated));

  // Dispatch custom event to notify all listening components on this page
  window.dispatchEvent(new CustomEvent('poker:wallet_updated', { detail: { coins: updated } }));
  return updated;
}

/**
 * Deduct coins from user's account balance (e.g. for buy-in)
 */
export function deductAccountCoins(amount: number): boolean {
  if (amount <= 0 || typeof window === 'undefined') return true;

  const current = getAccountCoins();
  if (current < amount) return false;

  const updated = current - Math.round(amount);
  localStorage.setItem(WALLET_KEY, String(updated));
  window.dispatchEvent(new CustomEvent('poker:wallet_updated', { detail: { coins: updated } }));
  return true;
}

/**
 * Set exact user account balance (strictly called when exiting table with chips)
 */
export function setAccountCoins(amount: number): number {
  if (typeof window === 'undefined') return 0;
  const finalAmount = Math.max(0, Math.round(amount));
  localStorage.setItem(WALLET_KEY, String(finalAmount));
  window.dispatchEvent(new CustomEvent('poker:wallet_updated', { detail: { coins: finalAmount } }));
  return finalAmount;
}

/**
 * Check if the user hasn't acknowledged the 100k welcome gift yet
 */
export function isWelcomeGiftUnseen(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(WELCOME_SEEN_KEY) === 'false';
}

/**
 * Mark welcome gift acknowledged
 */
export function markWelcomeGiftSeen(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(WELCOME_SEEN_KEY, 'true');
  window.dispatchEvent(new CustomEvent('poker:welcome_seen'));
}

/**
 * Strict ₹1,00,000 Reload for when user reaches ₹0 coins.
 * Anti-loophole protection: if user has > 0 coins, reload is rejected.
 */
export function reload100kCoins(): number {
  if (typeof window === 'undefined') return 0;
  const current = getAccountCoins();
  // Strictly prevent loophole: only allow reload when balance is 0 or less
  if (current > 0) return current;

  localStorage.setItem(WALLET_KEY, String(DEFAULT_WELCOME_COINS));
  window.dispatchEvent(
    new CustomEvent('poker:wallet_updated', { detail: { coins: DEFAULT_WELCOME_COINS } })
  );
  return DEFAULT_WELCOME_COINS;
}

/**
 * Check if player has run completely out of coins (eligible for reload prompt)
 */
export function isEligibleFor100kReload(): boolean {
  return getAccountCoins() <= 0;
}

/**
 * React hook to reactively subscribe to account balance updates
 */
export function useAccountWallet() {
  const [coins, setCoins] = useState<number>(() => getAccountCoins());
  const [showWelcome, setShowWelcome] = useState<boolean>(() => isWelcomeGiftUnseen());

  useEffect(() => {
    // Sync initial state
    setCoins(getAccountCoins());
    setShowWelcome(isWelcomeGiftUnseen());

    const handleUpdate = (e: any) => {
      if (e.detail?.coins !== undefined) {
        setCoins(e.detail.coins);
      } else {
        setCoins(getAccountCoins());
      }
    };

    const handleWelcomeSeen = () => {
      setShowWelcome(false);
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === WALLET_KEY) {
        setCoins(getAccountCoins());
      }
      if (e.key === WELCOME_SEEN_KEY) {
        setShowWelcome(isWelcomeGiftUnseen());
      }
    };

    window.addEventListener('poker:wallet_updated', handleUpdate);
    window.addEventListener('poker:welcome_seen', handleWelcomeSeen);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('poker:wallet_updated', handleUpdate);
      window.removeEventListener('poker:welcome_seen', handleWelcomeSeen);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const dismissWelcome = () => {
    markWelcomeGiftSeen();
    setShowWelcome(false);
  };

  return {
    coins,
    setCoins: setAccountCoins,
    addCoins: addAccountCoins,
    deductCoins: deductAccountCoins,
    reload100kCoins,
    isEligibleForReload: coins <= 0,
    showWelcome,
    dismissWelcome,
  };
}

