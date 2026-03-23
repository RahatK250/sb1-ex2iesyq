/**
 * DatabaseContext
 *
 * Runs useDatabase() exactly ONCE at the app root so every component that
 * needs database state shares the same subscriptions, queries, and cache.
 *
 * Previously App.tsx and SettingsPage.tsx each called useDatabase() separately,
 * causing 2× queries on every mount and 14 Realtime WebSocket channels instead
 * of 7.  Wrapping the app in <DatabaseProvider> fixes both issues instantly.
 */
import React, { createContext, useContext } from 'react';
import { useDatabase } from '../hooks/useDatabase';

type DatabaseContextType = ReturnType<typeof useDatabase>;

const DatabaseContext = createContext<DatabaseContextType | null>(null);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const db = useDatabase(); // ← called exactly once for the whole app
  return <DatabaseContext.Provider value={db}>{children}</DatabaseContext.Provider>;
};

/**
 * Drop-in replacement for `useDatabase()` everywhere outside the provider.
 * Throws a clear error if used outside <DatabaseProvider>.
 */
export const useDatabaseContext = (): DatabaseContextType => {
  const ctx = useContext(DatabaseContext);
  if (!ctx) {
    throw new Error('useDatabaseContext must be used inside <DatabaseProvider>');
  }
  return ctx;
};
