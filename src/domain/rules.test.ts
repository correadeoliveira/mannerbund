import { describe, expect, it } from 'vitest';
import { seed } from '../data/seed';
import {
  awardBadges,
  communityScores,
  distributeRewards,
  HOUR,
  membershipError,
  MINUTE,
  presenceDuration,
  refreshOwnership,
  seasonBounds,
  seasonKey,
  territoryOwner,
} from './rules';
import type { Presence } from './types';

const time = new Date('2026-11-06T15:00:00Z').getTime();
function presence(userId: string, communityId: string, start: number, duration: number): Presence {
  return {
    id: `${userId}-${start}`,
    userId,
    communityId,
    pointId: 'p1',
    source: 'demo',
    startedAt: start,
    endedAt: start + duration,
    lastSampleAt: start + duration,
    lastValid: true,
    intervals: [{ start, end: start + duration }],
  };
}
describe('collective territory and monthly seasons', () => {
  it('adds person-hours, preserves the incumbent on a tie and switches only after exceeding', () => {
    const data = seed(time);
    data.presences = [];
    data.ownership = [];
    for (let n = 0; n < 5; n++) data.presences.push(presence(`a${n}`, 'c1', time - HOUR, HOUR));
    refreshOwnership(data, time);
    expect(communityScores(data, 'p1', '2026-11')[0].duration).toBe(5 * HOUR);
    for (let n = 0; n < 5; n++) data.presences.push(presence(`b${n}`, 'c2', time - HOUR, HOUR));
    expect(territoryOwner(data, 'p1', '2026-11')).toBe('c1');
    for (let n = 5; n < 10; n++) data.presences.push(presence(`b${n}`, 'c2', time - HOUR, HOUR));
    for (let n = 0; n < 10; n++) data.presences.push(presence(`b${n}`, 'c2', time, HOUR));
    refreshOwnership(data, time + HOUR);
    expect(communityScores(data, 'p1', '2026-11')[0].duration).toBe(20 * HOUR);
    expect(territoryOwner(data, 'p1', '2026-11')).toBe('c2');
    expect(territoryOwner(data, 'p1', '2026-12')).toBeUndefined();
  });
  it('keeps a non-alphabetical incumbent on a tie', () => {
    const data = seed(time);
    data.presences = [
      presence('u1', 'c1', time - HOUR, HOUR),
      presence('u2', 'c2', time - HOUR, HOUR),
    ];
    data.ownership = [{ pointId: 'p1', season: '2026-11', communityId: 'c2', changedAt: time }];
    expect(territoryOwner(data, 'p1', '2026-11')).toBe('c2');
  });
  it('splits a session at São Paulo midnight, not UTC midnight', () => {
    const start = Date.parse('2026-11-30T23:30:00-03:00'),
      p = presence('u1', 'c1', start, HOUR);
    expect(seasonKey(start)).toBe('2026-11');
    expect(seasonKey(start + HOUR)).toBe('2026-12');
    expect(presenceDuration(p, seasonBounds('2026-11'))).toBe(30 * MINUTE);
    expect(presenceDuration(p, seasonBounds('2026-12'))).toBe(30 * MINUTE);
  });
  it('unions duplicate and overlapping intervals and clips the event window', () => {
    const p = presence('u1', 'c1', time, HOUR);
    p.intervals.push({ start: time + 20 * MINUTE, end: time + 80 * MINUTE });
    expect(presenceDuration(p)).toBe(80 * MINUTE);
    expect(presenceDuration(p, { start: time + 30 * MINUTE, end: time + 70 * MINUTE })).toBe(
      40 * MINUTE,
    );
  });
});
describe('membership slots', () => {
  it('keeps the own and other slots separate and lets Premium exceed both', () => {
    const data = seed(time),
      u = data.users[0];
    expect(membershipError(data, u, 'own')).toContain('própria');
    expect(membershipError(data, u, 'join')).toContain('outro');
    u.premium = true;
    expect(membershipError(data, u, 'own')).toBeNull();
    expect(membershipError(data, u, 'join')).toBeNull();
    expect(membershipError(data, data.users[6], 'own')).toBeNull();
    expect(membershipError(data, data.users[6], 'join')).toBeNull();
  });
});
describe('event badges and rewards', () => {
  it('requires RSVP, threshold and event end; awards once and snapshots the trophy', () => {
    const data = seed(time);
    data.presences = [];
    data.badges = [];
    const event = data.events[0];
    event.start = time;
    event.end = time + HOUR;
    event.minimumMinutes = 30;
    event.acceptedIds = ['u1'];
    const p = presence('u1', 'c1', time, 29 * MINUTE);
    p.eventId = event.id;
    data.presences.push(p);
    awardBadges(data, time + HOUR);
    expect(data.badges).toHaveLength(0);
    p.intervals.push({ start: time + 29 * MINUTE, end: time + 30 * MINUTE });
    awardBadges(data, time + 30 * MINUTE);
    expect(data.badges).toHaveLength(0);
    awardBadges(data, time + HOUR);
    expect(data.badges).toHaveLength(1);
    const original = data.badges[0].title;
    event.badgeTitle = 'Changed';
    event.acceptedIds = [];
    data.memberships = [];
    awardBadges(data, time + 2 * HOUR);
    expect(data.badges).toHaveLength(1);
    expect(data.badges[0].title).toBe(original);
  });
  it('does not grant event badges for a free visit or an unaccepted invitation', () => {
    const data = seed(time);
    data.badges = [];
    data.presences = [presence('u1', 'c1', data.events[0].start, HOUR)];
    awardBadges(data, data.events[0].end);
    expect(data.badges).toHaveLength(0);
    data.presences[0].eventId = data.events[0].id;
    data.events[0].acceptedIds = [];
    awardBadges(data, data.events[0].end);
    expect(data.badges).toHaveLength(0);
  });
  it('distributes the exact pool in cents, including equal shares and zero presence', () => {
    const rows = Array.from({ length: 7 }, (_, n) => ({ userId: `u${n}`, duration: HOUR })),
      allocations = distributeRewards(rows);
    expect(allocations.reduce((s, r) => s + r.cents, 0)).toBe(100_000);
    expect(
      Math.max(...allocations.map((r) => r.cents)) - Math.min(...allocations.map((r) => r.cents)),
    ).toBe(1);
    expect(distributeRewards([{ userId: 'none', duration: 0 }])).toEqual([]);
    expect(
      distributeRewards([
        { userId: 'u1', duration: HOUR },
        { userId: 'u2', duration: 3 * HOUR },
      ]).map((r) => r.cents),
    ).toEqual([25000, 75000]);
  });
  it('provides coherent sample history without simultaneous sessions per person', () => {
    const data = seed(time);
    for (const u of data.users) {
      const sessions = data.presences
        .filter((p) => p.userId === u.id)
        .sort((a, b) => a.startedAt - b.startedAt);
      for (let n = 1; n < sessions.length; n++)
        expect(sessions[n].startedAt).toBeGreaterThanOrEqual(sessions[n - 1].endedAt!);
    }
    expect(data.communities).toHaveLength(6);
    expect(data.points).toHaveLength(8);
  });
});
