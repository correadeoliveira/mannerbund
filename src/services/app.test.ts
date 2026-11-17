import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db, initialize, LocalDatabase, update } from '../data/database';
import { seed } from '../data/seed';
import { app, createApplication } from './app';
import {
  earnedPathEvents,
  HOUR,
  MINUTE,
  presenceDuration,
  seasonBounds,
  seasonKey,
} from '../domain/rules';

const initial = Date.parse('2026-11-06T15:00:00Z');
beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(initial);
  await db.state.put(seed(initial));
});
afterEach(() => vi.useRealTimers());
const state = async () => (await db.state.get('app'))!;

describe('community paths', () => {
  it('limits creation to the owner and requires three distinct events in that community', async () => {
    const path = (await state()).paths[0];
    await expect(app.createPath('u2', path)).rejects.toThrow('administrador');
    await expect(app.createPath('u1', { ...path, eventIds: ['e4', 'e4', 'e5'] })).rejects.toThrow(
      'diferentes',
    );
    await expect(app.createPath('u1', { ...path, eventIds: ['e4', 'e2', 'e5'] })).rejects.toThrow(
      'desta comunidade',
    );
    await expect(
      app.createPath('u1', { ...path, eventIds: ['e4', 'ausente', 'e5'] }),
    ).rejects.toThrow('desta comunidade');
    const id = await app.createPath('u1', { ...path, eventIds: ['e5', 'e4', 'e1'] });
    expect((await state()).paths.find((item) => item.id === id)?.eventIds).toEqual([
      'e5',
      'e4',
      'e1',
    ]);
  });

  it('requires membership and records one voluntary enrollment per person and path', async () => {
    const path = (await state()).paths[0];
    expect((await state()).pathEnrollments).toHaveLength(0);
    await expect(app.startPath('u7', path.id)).rejects.toThrow('Entre nesta comunidade');
    await Promise.all([app.startPath('u1', path.id), app.startPath('u1', path.id)]);
    await app.startPath('u2', path.id);
    expect((await state()).pathEnrollments).toEqual([
      { pathId: path.id, userId: 'u1', startedAt: initial },
      { pathId: path.id, userId: 'u2', startedAt: initial },
    ]);
    expect(earnedPathEvents(await state(), path, 'u1')).toEqual(new Set(['e4']));
    expect(earnedPathEvents(await state(), path, 'u5')).toEqual(new Set());
  });

  it('completes from attendance out of order and preserves progress after leaving and reopening', async () => {
    const template = (await state()).paths[0];
    const pathId = await app.createPath('u1', { ...template, eventIds: ['e5', 'e1', 'e4'] });
    const path = (await state()).paths.find((item) => item.id === pathId)!;
    await app.startPath('u2', pathId);
    await app.rsvp('u2', 'e1');
    await app.advance(10);
    await app.startPresence('u2', 'p1', 'c1', 'demo', 'e1');
    await app.advance(30);
    expect(earnedPathEvents(await state(), path, 'u2')).toEqual(new Set(['e4']));
    await app.advance(30);
    expect(earnedPathEvents(await state(), path, 'u2')).toEqual(new Set(['e4', 'e1']));
    await app.rsvp('u2', 'e5');
    await app.advance(50);
    await app.startPresence('u2', 'p8', 'c1', 'demo', 'e5');
    await app.advance(60);
    await app.leave('u2', 'c1');
    db.close();
    await db.open();
    await initialize();
    const persisted = await state();
    expect(persisted.pathEnrollments).toContainEqual({ pathId, userId: 'u2', startedAt: initial });
    expect(earnedPathEvents(persisted, path, 'u2')).toEqual(new Set(['e4', 'e1', 'e5']));
    expect(earnedPathEvents(persisted, path, 'u1')).toEqual(new Set(['e4']));
  });

  it('migrates a version one database without resetting its records or uploads', async () => {
    const name = 'mannerbund-path-migration-test';
    const legacy = new Dexie(name);
    legacy.version(1).stores({ state: 'id', media: 'id' });
    const { paths: _paths, pathEnrollments: _enrollments, ...snapshot } = seed(initial);
    const original = {
      ...snapshot,
      events: snapshot.events.filter((event) => event.id !== 'e5'),
      version: 1,
    };
    const upload = { id: 'local-photo', blob: new Blob(['perfil'], { type: 'image/png' }) };
    const upgraded = new LocalDatabase(name);
    try {
      await legacy.table('state').put(original);
      await legacy.table('media').put(upload);
      legacy.close();
      expect(await upgraded.state.get('app')).toEqual({
        ...original,
        version: 2,
        paths: [],
        pathEnrollments: [],
      });
      expect(await (await upgraded.media.get(upload.id))?.blob.text()).toBe('perfil');
    } finally {
      legacy.close();
      await upgraded.delete();
    }
  });

  it('seeds a completed first encounter even at the start of a season', () => {
    const data = seed(seasonBounds(seasonKey(initial)).start);
    const path = data.paths[0];
    expect(earnedPathEvents(data, path, 'u1')).toEqual(new Set(['e4']));
  });
});

describe('local application services', () => {
  it('uses one own slot and one other slot, and preserves extra owned communities after downgrade', async () => {
    const input = {
      name: 'Uma comunidade',
      category: 'Ao ar livre',
      description: 'Um encontro para começar.',
      color: '#B68A4D',
      emblem: 'sun' as const,
      cover: '/images/trail.jpg',
      preset: 'Bronze',
    };
    const first = await app.createCommunity('u7', input);
    await app.join('u7', 'c1');
    await expect(app.createCommunity('u7', { ...input, name: 'Outra' })).rejects.toThrow('própria');
    await expect(app.join('u7', 'c2')).rejects.toThrow('outro');
    await app.premium('u7');
    const extra = await app.createCommunity('u7', { ...input, name: 'Outra' });
    await app.premium('u7');
    expect(
      (await state()).memberships.filter((m) => m.userId === 'u7').map((m) => m.communityId),
    ).toEqual(expect.arrayContaining([first, extra, 'c1']));
  });
  it('revokes community chat access on removal without changing a private conversation', async () => {
    await app.removeMember('u1', 'u2', 'c1');
    await expect(app.send('u2', 'ch-c1', 'Não deve entrar')).rejects.toThrow('acesso');
    await app.send('u2', 'dm-u1-u2', 'A conversa privada continua.');
    expect((await state()).messages.at(-1)?.text).toBe('A conversa privada continua.');
  });
  it('accepts an injected clock without changing domain or persistence code', async () => {
    const custom = createApplication({ now: () => initial + 5 * MINUTE });
    const id = await custom.startPresence('u1', 'p1', 'c1', 'demo');
    await custom.advance(10);
    const p = (await state()).presences.find((p) => p.id === id)!;
    expect(p.startedAt).toBe(initial + 5 * MINUTE);
    expect(presenceDuration(p)).toBe(10 * MINUTE);
  });
  it('does not credit a short reload gap between otherwise fresh GPS samples', async () => {
    const id = await app.startPresence('u1', 'p1', 'c1', 'gps');
    const point = (await state()).points[0];
    await app.sample('u1', { ...point, accuracy: 5, timestamp: initial });
    vi.setSystemTime(initial + 10_000);
    await initialize();
    await app.sample('u1', { ...point, accuracy: 5, timestamp: Date.now() });
    expect(presenceDuration((await state()).presences.find((p) => p.id === id)!)).toBe(0);
    vi.setSystemTime(initial + 20_000);
    await app.sample('u1', { ...point, accuracy: 5, timestamp: Date.now() });
    expect(presenceDuration((await state()).presences.find((p) => p.id === id)!)).toBe(10_000);
  });
  it('initializes once and preserves modifications', async () => {
    await app.editProfile('u1', { name: 'Rafa Teste', bio: 'Persistido', avatar: undefined });
    await initialize();
    expect((await state()).users[0].name).toBe('Rafa Teste');
    db.close();
    await db.open();
    expect((await state()).users[0].bio).toBe('Persistido');
  });
  it('serializes competing check-ins and rejects a second active session', async () => {
    const result = await Promise.allSettled([
      app.startPresence('u1', 'p1', 'c1', 'demo'),
      app.startPresence('u1', 'p6', 'c2', 'demo'),
    ]);
    expect(result.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect((await state()).presences.filter((p) => p.userId === 'u1' && !p.endedAt)).toHaveLength(
      1,
    );
  });
  it('never gives suspended time credit on reload or checkout', async () => {
    const id = await app.startPresence('u1', 'p1', 'c1', 'demo');
    vi.setSystemTime(initial + 2 * HOUR);
    await app.endPresence('u1');
    expect(presenceDuration((await state()).presences.find((p) => p.id === id)!)).toBe(0);
  });
  it('pauses demo time outside the geofence and preserves previous credit', async () => {
    const id = await app.startPresence('u1', 'p1', 'c1', 'demo');
    await app.advance(10);
    await app.setDemoInside('u1', false);
    await app.advance(30);
    await app.setDemoInside('u1', true);
    await app.advance(20);
    expect(presenceDuration((await state()).presences.find((p) => p.id === id)!)).toBeCloseTo(
      30 * MINUTE,
      -1,
    );
  });
  it('requires consecutive fresh GPS samples and skips gaps, inaccurate, outside and hidden samples', async () => {
    const id = await app.startPresence('u1', 'p1', 'c1', 'gps'),
      point = (await state()).points[0];
    const sample = async (seconds: number, accuracy = 5, visible = true, lat = point.lat) => {
      vi.setSystemTime(initial + seconds * 1000);
      await app.sample('u1', { lat, lng: point.lng, accuracy, timestamp: Date.now() }, visible);
    };
    await sample(0);
    await sample(10);
    await sample(20, 150);
    await sample(30);
    await sample(40);
    await sample(80);
    await sample(90, 5, false);
    await sample(100);
    await sample(110, 5, true, point.lat + 0.1);
    await sample(120);
    await sample(130);
    expect(presenceDuration((await state()).presences.find((p) => p.id === id)!)).toBe(30_000);
    await expect(app.advance(10)).rejects.toThrow('GPS');
  });
  it('rejects unaccepted, mismatched and out-of-window event check-ins', async () => {
    await expect(app.startPresence('u1', 'p1', 'c1', 'demo', 'e1')).rejects.toThrow('horário');
    await app.advance(11);
    await expect(app.startPresence('u2', 'p1', 'c1', 'demo', 'e1')).rejects.toThrow('convite');
    await expect(app.startPresence('u1', 'p6', 'c1', 'demo', 'e1')).rejects.toThrow('corresponde');
  });
  it('completes RSVP → attendance → event end → one badge and survives membership removal', async () => {
    await app.rsvp('u2', 'e1');
    await app.advance(11);
    const id = await app.startPresence('u2', 'p1', 'c1', 'demo', 'e1');
    await app.advance(30);
    expect((await state()).badges.some((b) => b.eventId === 'e1' && b.userId === 'u2')).toBe(false);
    await app.advance(30);
    await app.settle();
    await app.settle();
    const data = await state();
    expect(data.presences.find((p) => p.id === id)?.endedAt).toBe(data.events[0].end);
    expect(data.badges.filter((b) => b.eventId === 'e1' && b.userId === 'u2')).toHaveLength(1);
    await app.removeMember('u1', 'u2', 'c1');
    expect(
      (await state()).badges.filter((b) => b.eventId === 'e1' && b.userId === 'u2'),
    ).toHaveLength(1);
    expect((await state()).presences.find((p) => p.id === id)).toBeDefined();
  });
  it('enforces free limits and retains extra memberships after Premium deactivation', async () => {
    await expect(app.join('u1', 'c3')).rejects.toThrow('Premium');
    await app.premium('u1');
    await app.join('u1', 'c3');
    await app.premium('u1');
    expect(
      (await state()).memberships.some((m) => m.userId === 'u1' && m.communityId === 'c3'),
    ).toBe(true);
    await expect(app.join('u1', 'c4')).rejects.toThrow('Premium');
  });
  it('enforces post, channel, event and message moderation permissions', async () => {
    await expect(app.deletePost('u2', 'post1')).rejects.toThrow('excluir');
    await expect(app.createChannel('u2', 'c1', 'Teste')).rejects.toThrow('administrador');
    await expect(app.removeMember('u2', 'u3', 'c1')).rejects.toThrow('administrador');
    await expect(app.send('u7', 'ch-c1', 'Mensagem invasora')).rejects.toThrow('acesso');
    await expect(app.deleteMessage('u3', 'm4')).rejects.toThrow('excluir');
    await expect(app.createPost('u2', 'Post em nome de outro', undefined, 'c1')).rejects.toThrow(
      'administrador',
    );
    await app.deleteMessage('u1', 'm1');
    expect((await state()).messages.find((m) => m.id === 'm1')?.deleted).toBe(true);
  });
  it('creates exactly one private thread for an unordered pair', async () => {
    const a = await app.dm('u1', 'u3'),
      b = await app.dm('u3', 'u1');
    expect(a).toBe(b);
    await expect(app.dm('u1', 'u1')).rejects.toThrow('outra pessoa');
  });
  it('allows multiple unique community channels', async () => {
    const a = await app.createChannel('u1', 'c1', 'Café depois'),
      b = await app.createChannel('u1', 'c1', 'Ritmos');
    expect(a).not.toBe(b);
    await expect(app.createChannel('u1', 'c1', 'café depois')).rejects.toThrow('Já existe');
  });
  it('keeps old season scores and resets current territories on rollover', async () => {
    const data = await state(),
      oldSeason = seasonKey(initial),
      target = seasonBounds(oldSeason).end;
    await app.advance(Math.ceil((target - initial) / MINUTE) + 1);
    const next = await state();
    expect(next.ownership.filter((o) => o.season === oldSeason)).toEqual(
      data.ownership.filter((o) => o.season === oldSeason),
    );
    expect(next.ownership.some((o) => o.season === '2026-12')).toBe(false);
  });
  it('protects started event rules and validates badge minutes', async () => {
    const data = await state(),
      { id: _, acceptedIds: __, ...event } = data.events[0];
    await expect(app.createEvent('u1', { ...event, minimumMinutes: 1000 })).rejects.toThrow(
      'duração',
    );
    await app.advance(11);
    await expect(app.createEvent('u1', event, 'e1')).rejects.toThrow('iniciado');
  });
  it('keeps follows, comments and a chronological publication across reads', async () => {
    await app.follow('u1', 'u3');
    await app.comment('u1', 'post2', 'Teste local');
    const id = await app.createPost('u1', 'Uma nova história');
    const data = await state();
    expect(data.follows.some((f) => f.from === 'u1' && f.to === 'u3')).toBe(true);
    expect(data.posts.find((p) => p.id === 'post2')?.comments.at(-1)?.text).toBe('Teste local');
    expect([...data.posts].sort((a, b) => b.createdAt - a.createdAt)[0].id).toBe(id);
  });
  it('rejects duplicate nearby points and allows one shared point for rival events', async () => {
    const p = (await state()).points[0];
    await expect(app.createPoint('u1', 'c1', { ...p, name: 'Duplicado' })).rejects.toThrow(
      'Já existe',
    );
    const id = await app.createPoint('u1', 'c1', {
      lat: -23.6,
      lng: -46.7,
      name: 'Novo encontro',
      neighborhood: 'São Paulo',
    });
    expect((await state()).points.find((p) => p.id === id)?.radius).toBe(100);
  });
  it('rejects non-finite coordinates without corrupting stored records', async () => {
    const original = (await state()).points.length;
    await expect(
      app.createPoint('u1', 'c1', { lat: NaN, lng: 0, name: 'Inválido', neighborhood: 'Teste' }),
    ).rejects.toThrow('coordenadas');
    expect((await state()).points).toHaveLength(original);
  });
  it('preserves immutable trophy details after other records change', async () => {
    const before = (await state()).badges[0];
    await update((data) => {
      data.events.find((e) => e.id === before.eventId)!.badgeTitle = 'Outro';
      data.communities.find((c) => c.id === before.communityId)!.name = 'Outro nome';
    });
    expect((await state()).badges.find((b) => b.id === before.id)).toEqual(before);
  });
});
