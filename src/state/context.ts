import { createContext, useContext } from 'react';
import type { AppData } from '../domain/types';
import { useUI } from './ui';

// Keep the context identity outside component modules so Vite can refresh UI safely.
export const DataContext = createContext<AppData | null>(null);
export const VisitorContext = createContext<{ userId: string; now: number } | null>(null);
export function useApp() {
  const data = useContext(DataContext);
  const localId = useUI((s) => s.userId);
  const visitor = useContext(VisitorContext);
  const userId = visitor?.userId ?? localId;
  if (!data) throw new Error('Dados indisponíveis.');
  return {
    data,
    userId,
    user: data.users.find((u) => u.id === userId) ?? data.users[0],
    now: visitor?.now ?? Date.now() + data.clockOffset,
  };
}
