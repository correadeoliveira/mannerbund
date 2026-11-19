import Dexie, { type EntityTable } from 'dexie';
import { seedGuilds, type GuildWorld } from './world';

export class GuildDatabase extends Dexie {
  worlds!: EntityTable<GuildWorld, 'id'>;
  constructor(name = 'mannerbund-guildas-v1') {
    super(name);
    this.version(1).stores({ worlds: 'id' });
  }
  async initialize() {
    await this.transaction('rw', this.worlds, async () => {
      if (!(await this.worlds.get('app'))) await this.worlds.add(seedGuilds());
    });
  }
  async change<T>(operation: (world: GuildWorld) => Promise<T>): Promise<T> {
    return this.transaction('rw', this.worlds, async () => {
      const world = await this.worlds.get('app');
      if (!world) throw new Error('Abra a visita novamente para carregar sua guilda.');
      const result = await operation(world);
      await this.worlds.put(world);
      return result;
    });
  }
}

export const guildDb = new GuildDatabase();
