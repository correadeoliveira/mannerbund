import { createContext, useContext } from 'react';
import type { AppData } from '../domain/types';
import { useUI } from './ui';

// Keep the context identity outside component modules so Vite can refresh UI safely.
export const DataContext = createContext<AppData | null>(null);
export function useApp() {
  const data = useContext(DataContext);
  const userId = useUI((s) => s.userId);
  if (!data) throw new Error('Dados indisponíveis.');
  return {
    data,
    userId,
    user: data.users.find((u) => u.id === userId) ?? data.users[0],
    now: Date.now() + data.clockOffset,
  };
}
