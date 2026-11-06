import Dexie, { type EntityTable } from 'dexie';
import type { AppData } from '../domain/types';
import { seed } from './seed';

export class LocalDatabase extends Dexie {
  state!: EntityTable<AppData, 'id'>;
  media!: EntityTable<{ id: string; blob: Blob }, 'id'>;
  constructor(name = 'mannerbund-v1') {
    super(name);
    this.version(1).stores({ state: 'id', media: 'id' });
  }
}
export const db = new LocalDatabase();
export async function initialize() {
  await db.transaction('rw', db.state, async () => {
    const existing = await db.state.get('app');
    if (!existing) await db.state.add(seed());
    else {
      let changed = false;
      for (const p of existing.presences.filter((p) => !p.endedAt && p.source === 'gps')) {
        // Reload is a discontinuity: the first new sample starts a new baseline.
        p.lastValid = false;
        p.lastSampleAt = Date.now() + existing.clockOffset;
        changed = true;
      }
      if (changed) await db.state.put(existing);
    }
  });
}
export async function update<T>(fn: (data: AppData) => T): Promise<T> {
  return db.transaction('rw', db.state, async () => {
    const data = await db.state.get('app');
    if (!data) throw new Error('Não foi possível abrir seus dados. Recarregue a página.');
    const result = fn(data);
    await db.state.put(data);
    return result;
  });
}
export async function saveImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Escolha um arquivo de imagem.');
  if (file.size > 5 * 1024 * 1024) throw new Error('A imagem deve ter no máximo 5 MB.');
  const id = crypto.randomUUID();
  await db.media.put({ id, blob: file });
  return `media:${id}`;
}
export async function resetDemo() {
  await db.transaction('rw', db.state, db.media, async () => {
    await db.media.clear();
    await db.state.put(seed());
  });
}
