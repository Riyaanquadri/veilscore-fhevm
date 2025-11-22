/**
 * useUserHistory.ts
 * 
 * Custom hook to manage user input history with localStorage persistence
 * Stores and retrieves user's Twitter handles and wallet addresses
 */

import { useEffect, useState } from 'react';

export interface UserHistoryEntry {
  twitterHandle: string;
  walletAddress: string;
  timestamp: number;
  followers?: number;
  txCount?: number;
  tier?: string;
}

const STORAGE_KEY = 'veilscore_user_history';
const MAX_HISTORY_ENTRIES = 10;

/**
 * Load history from localStorage
 */
function loadHistoryFromStorage(): UserHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as UserHistoryEntry[];
  } catch (err) {
    console.error('[useUserHistory] Failed to load history:', err);
    return [];
  }
}

/**
 * Save history to localStorage
 */
function saveHistoryToStorage(entries: UserHistoryEntry[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (err) {
    console.error('[useUserHistory] Failed to save history:', err);
  }
}

/**
 * Hook for managing user history
 * 
 * Usage:
 * ```tsx
 * const { history, lastEntry, addEntry, clearHistory } = useUserHistory();
 * 
 * // Auto-populate on mount
 * useEffect(() => {
 *   if (lastEntry) {
 *     setTwitterHandle(lastEntry.twitterHandle);
 *     setWalletAddress(lastEntry.walletAddress);
 *   }
 * }, []);
 * 
 * // Save after successful computation
 * addEntry({ twitterHandle, walletAddress, followers, txCount, tier });
 * ```
 */
export function useUserHistory() {
  const [history, setHistory] = useState<UserHistoryEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load history on mount
  useEffect(() => {
    const loaded = loadHistoryFromStorage();
    setHistory(loaded);
    setIsLoaded(true);
    console.log('[useUserHistory] Loaded', loaded.length, 'history entries');
  }, []);

  /**
   * Add a new entry to history
   * Deduplicates by (twitterHandle, walletAddress) pair
   */
  const addEntry = (entry: Omit<UserHistoryEntry, 'timestamp'>) => {
    if (!isLoaded) {
      console.warn('[useUserHistory] History not loaded yet');
      return;
    }

    // Don't add if both fields are empty
    if (!entry.twitterHandle && !entry.walletAddress) {
      return;
    }

    const newEntry: UserHistoryEntry = {
      ...entry,
      timestamp: Date.now(),
    };

    // Remove duplicate entry if it exists
    const filtered = history.filter(
      (h) =>
        !(h.twitterHandle === entry.twitterHandle && h.walletAddress === entry.walletAddress)
    );

    // Add new entry at the beginning (most recent first)
    const updated = [newEntry, ...filtered].slice(0, MAX_HISTORY_ENTRIES);
    setHistory(updated);
    saveHistoryToStorage(updated);

    console.log('[useUserHistory] Added entry, total:', updated.length);
  };

  /**
   * Get the most recent history entry
   */
  const lastEntry = history.length > 0 ? history[0] : null;

  /**
   * Clear all history
   */
  const clearHistory = () => {
    setHistory([]);
    saveHistoryToStorage([]);
    console.log('[useUserHistory] History cleared');
  };

  /**
   * Remove a specific entry
   */
  const removeEntry = (index: number) => {
    const updated = history.filter((_, i) => i !== index);
    setHistory(updated);
    saveHistoryToStorage(updated);
    console.log('[useUserHistory] Entry removed, total:', updated.length);
  };

  /**
   * Update an existing entry (e.g., add data after fetching signals)
   */
  const updateEntry = (
    index: number,
    updates: Partial<Omit<UserHistoryEntry, 'timestamp'>>
  ) => {
    const updated = history.map((entry, i) =>
      i === index ? { ...entry, ...updates } : entry
    );
    setHistory(updated);
    saveHistoryToStorage(updated);
  };

  return {
    history,
    lastEntry,
    addEntry,
    clearHistory,
    removeEntry,
    updateEntry,
    isLoaded,
  };
}
