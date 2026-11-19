import { createContext, useContext } from 'react';
import type { GuildWorld } from './world';
import type { experience } from './experience';

export type Runtime = { world: GuildWorld; actions: typeof experience };
export const GuildContext = createContext<Runtime | null>(null);
export function useGuild() {
  const value = useContext(GuildContext);
  if (!value) throw new Error('Visita indisponível.');
  return value;
}
