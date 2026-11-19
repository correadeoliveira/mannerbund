import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  communityScores,
  MINUTE,
  presenceDuration,
  seasonKey,
  territoryOwner,
  visitsByMonth,
} from '../domain/rules';
import { GuildDatabase } from './repository';
import { createGuildExperience, nextCue } from './experience';
import { guilds, replyTo, visitorId } from './scripts';
import { guestGuild, seedGuilds, worldTime } from './world';
import { LocalDatabase } from '../data/database';
import { seed } from '../data/seed';

const date = Date.parse('2026-12-01T03:00:01Z');
let db: GuildDatabase;
let actions: ReturnType<typeof createGuildExperience>;
const read = async () => (await db.worlds.get('app'))!;
beforeEach(async () => {
  db = new GuildDatabase('guild-test-' + crypto.randomUUID());
  await db.worlds.put(seedGuilds(date));
  actions = createGuildExperience(db);
});
afterEach(async () => {
  await db.delete();
});

describe('roteiros das guildas', () => {
  it.each(guilds)(
    'conclui $title a partir de um convite, três presenças e uma conquista',
    async (script) => {
      const id = script.communityId;
      await actions.join(id);
      const before = await read();
      expect(before.messages.at(-1)?.text).toBe(script.welcome);
      const season = seasonKey(worldTime(before));
      expect(communityScores(before, script.pointId, season)[0].duration).toBe(75 * MINUTE);
      await expect(actions.arrive(id)).rejects.toThrow('Confirme');
      await actions.confirm(id);
      await actions.arrive(id);
      await actions.finish(id, 30);
      const world = await read();
      const event = world.events[0];
      expect(event.acceptedIds).toHaveLength(3);
      expect(
        world.presences
          .filter((p) => p.eventId === event.id)
          .map((p) => [p.source, presenceDuration(p)]),
      ).toEqual(Array(3).fill(['demo', 30 * MINUTE]));
      expect(
        communityScores(world, script.pointId, season).map((s) => s.duration / MINUTE),
      ).toEqual([90, 75]);
      expect(territoryOwner(world, script.pointId, season)).toBe(id);
      expect(world.badges.filter((b) => b.userId === visitorId).map((b) => b.title)).toEqual([
        script.badge,
      ]);
      expect(world.posts.at(-1)?.userId).toBe(world.communities.find((c) => c.id === id)?.ownerId);
      expect(visitsByMonth(world, visitorId, 'gps').size).toBe(0);
      expect([...visitsByMonth(world, visitorId, 'demo').values()].flat()).toHaveLength(1);
      expect(nextCue(world.visits[id])).toBeUndefined();
    },
  );
  it('mantém 10 minutos, domínio rival e insígnia pendente na saída antecipada', async () => {
    await actions.join('c1');
    await actions.confirm('c1');
    await actions.arrive('c1');
    await actions.finish('c1', 10);
    const world = await read();
    expect(
      communityScores(world, 'p1', seasonKey(worldTime(world))).map((s) => s.duration / MINUTE),
    ).toEqual([75, 70]);
    expect(presenceDuration(world.presences.find((p) => p.userId === visitorId)!)).toBe(
      10 * MINUTE,
    );
    expect(world.badges.filter((b) => b.userId === visitorId)).toHaveLength(0);
    expect(world.badges).toHaveLength(2);
  });
  it('serializa duas abas e retoma um check-in sem adiantar o relógio', async () => {
    const other = new GuildDatabase(db.name);
    try {
      const second = createGuildExperience(other);
      await Promise.all([actions.join('c3'), second.join('c3')]);
      await Promise.all([actions.confirm('c3'), second.confirm('c3')]);
      await Promise.all([actions.arrive('c3'), second.arrive('c3')]);
      await other.initialize();
      const before = await read();
      expect(before.visits.c3.stage).toBe('present');
      expect(worldTime(before)).toBe(before.events[0].start);
      expect(before.events).toHaveLength(1);
      expect(before.presences.filter((p) => !p.endedAt)).toHaveLength(3);
      await Promise.all([actions.finish('c3', 30), second.finish('c3', 30)]);
      const after = await read();
      expect(after.posts.filter((p) => p.communityId === 'c3')).toHaveLength(2);
      expect(after.badges).toHaveLength(3);
      expect(after.clockOffset - before.clockOffset).toBe(30 * MINUTE);
    } finally {
      other.close();
    }
  });
  it('pausa falas, responde uma vez por mensagem e encerra a conversa espontânea', async () => {
    await actions.join('c4');
    await actions.pause('c4', true);
    await actions.chat('c4', 'É minha primeira vez');
    await actions.cue('c4', 'conversa-0');
    expect((await read()).messages).toHaveLength(2);
    await expect(actions.confirm('c4')).rejects.toThrow('Retome');
    await actions.pause('c4', false);
    const cue = nextCue((await read()).visits.c4)!;
    await Promise.all([actions.cue('c4', cue), actions.cue('c4', cue)]);
    expect((await read()).messages.at(-1)?.text).toBe(guilds[3].newcomer);
    await actions.cue('c4', 'conversa-0');
    await actions.cue('c4', 'conversa-1');
    expect(nextCue((await read()).visits.c4)).toBeUndefined();
    expect((await read()).messages).toHaveLength(5);
    expect(replyTo(guilds[3], 'Qual é o HORÁRIO?', '08:01')).toContain('08:01');
    expect(replyTo(guilds[3], 'Onde vocês se encontram?', '08:01')).toBe(guilds[3].meeting);
  });
  it('exige confirmação para trocar e conserva o convite anterior e os troféus', async () => {
    await actions.join('c1');
    await actions.confirm('c1');
    await expect(actions.join('c2')).rejects.toThrow('Confirme a saída');
    await actions.join('c2', 'c1');
    await actions.confirm('c2');
    await actions.arrive('c2');
    await actions.finish('c2', 30);
    await expect(actions.chat('c1', 'Oi')).rejects.toThrow('Faça parte');
    await actions.join('c1', 'c2');
    await actions.arrive('c1');
    await actions.finish('c1', 30);
    const world = await read();
    expect(guestGuild(world)).toBe('c1');
    expect(world.badges.filter((b) => b.userId === visitorId)).toHaveLength(2);
    expect(world.events).toHaveLength(2);
    await actions.join('c2', 'c1');
    expect((await read()).visits.c2.stage).toBe('finished');
  });
  it('explicita a saída de um check-in durante a troca e não credita tempo ao visitante', async () => {
    await actions.join('c5');
    await actions.confirm('c5');
    await actions.arrive('c5');
    await actions.join('c6', 'c5');
    const world = await read();
    expect(world.visits.c5.stage).toBe('finished');
    expect(
      communityScores(world, 'p8', seasonKey(worldTime(world))).map((s) => s.duration / MINUTE),
    ).toEqual([75, 60]);
    expect(world.presences.some((p) => !p.endedAt)).toBe(false);
  });
  it('preserva a identidade do visitante e os dados do protótipo original', async () => {
    const original = new LocalDatabase('legacy-test-' + crypto.randomUUID());
    try {
      const baseline = seed(date);
      await original.state.put(baseline);
      await actions.rename('Luna');
      await actions.dress({ hair: 'braided', outfit: 'cloak', background: 'clay' });
      await db.initialize();
      const user = (await read()).users.find((u) => u.id === visitorId)!;
      expect(user.name).toBe('Luna');
      expect(user.character?.outfit).toBe('cloak');
      expect(await original.state.get('app')).toEqual(baseline);
    } finally {
      await original.delete();
    }
  });
});
