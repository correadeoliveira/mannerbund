import { describe, expect, it } from 'vitest';
import { seed } from '../data/seed';
import {
  availableBrooches,
  communityLevel,
  communityXpHistory,
  duelNeedsAction,
  duelResult,
  nextCommunityXp,
  validDuelMoves,
} from './play';
import type { Duel } from './types';

describe('community experience', () => {
  it('counts existing event badges once per event and separately by community', () => {
    const data = seed(Date.parse('2026-11-06T15:00:00Z'));
    const badge = data.badges.find((item) => item.userId === 'u1')!;
    data.badges.push({ ...badge, id: 'duplicate' });
    expect(communityLevel(data, 'u1', 'c1')).toEqual({ xp: 100, level: 1, progress: 100 });
    expect(communityLevel(data, 'u1', 'c2')).toEqual({ xp: 0, level: 1, progress: 0 });
    expect(
      data.presences.some((presence) => presence.userId === 'u1' && presence.communityId === 'c2'),
    ).toBe(true);
    data.memberships = [];
    expect(communityLevel(data, 'u1', 'c1').xp).toBe(100);
  });

  it('requires an enrollment for the path bonus and deduplicates the same three events', () => {
    const data = seed(Date.parse('2026-11-06T15:00:00Z'));
    const badge = data.badges.find((item) => item.userId === 'u1')!;
    const path = data.paths[0];
    data.paths.push({ ...path, id: 'another', eventIds: ['e5', 'e4', 'e1'] });
    data.badges.push(
      { ...badge, id: 'second', eventId: 'e1' },
      { ...badge, id: 'third', eventId: 'e5' },
    );
    expect(communityLevel(data, 'u1', 'c1')).toEqual({ xp: 300, level: 2, progress: 100 });
    expect(availableBrooches(data, 'u1')).toEqual([]);
    data.pathEnrollments = [path.id, 'another'].map((pathId, index) => ({
      pathId,
      userId: 'u1',
      startedAt: badge.date + 1000 + index,
    }));
    expect(communityLevel(data, 'u1', 'c1')).toEqual({ xp: 500, level: 3, progress: 100 });
    expect(communityXpHistory(data, 'u1', 'c1')[0]).toMatchObject({
      kind: 'path',
      id: path.id,
      xp: 200,
      date: badge.date + 1000,
    });
    expect(availableBrooches(data, 'u1').map((community) => community.id)).toEqual(['c1']);
    expect(availableBrooches(data, 'u2')).toEqual([]);
    data.badges = data.badges.filter((item) => item.id !== 'third');
    expect(communityLevel(data, 'u1', 'c1')).toEqual({ xp: 200, level: 2, progress: 0 });
  });

  it('suggests the next invited encounter and keeps the action private to members', () => {
    const now = Date.parse('2026-11-06T15:00:00Z');
    const data = seed(now);
    expect(nextCommunityXp(data, 'u1', 'c1', now)?.to).toBe('/eventos/e1');
    expect(nextCommunityXp(data, 'u1', 'c1', data.events[0].end)?.to).toBe('/eventos/e5');
    expect(nextCommunityXp(data, 'u7', 'c1', now)).toBeUndefined();
  });
});

describe('duel scoring', () => {
  const match: Duel = {
    id: 'duel',
    challengerId: 'u1',
    opponentId: 'u2',
    status: 'finished',
    challengerMoves: ['strength', 'wit', 'guard'],
    opponentMoves: ['wit', 'guard', 'strength'],
  };

  it('applies all three matchups and hides the result before completion', () => {
    expect(duelResult({ ...match, status: 'active' })).toBeUndefined();
    expect(duelResult(match)).toMatchObject({ winner: 'u1', challengerWins: 3, opponentWins: 0 });
  });

  it('supports repeated choices and ties the whole duel when both win one round', () => {
    expect(validDuelMoves(['wit', 'wit', 'wit'])).toBe(true);
    expect(validDuelMoves(['wit', 'invalid', 'guard'])).toBe(false);
    expect(duelResult({ ...match, opponentMoves: ['wit', 'wit', 'wit'] })).toMatchObject({
      challengerWins: 1,
      opponentWins: 1,
      winner: null,
    });
  });

  it('only signals a response or an unsubmitted move to the relevant player', () => {
    const pending = { ...match, status: 'pending' as const };
    expect(duelNeedsAction(pending, 'u2')).toBe(true);
    expect(duelNeedsAction(pending, 'u1')).toBe(false);
    expect(duelNeedsAction(pending, 'u3')).toBe(false);
    const active = { ...match, status: 'active' as const, opponentMoves: undefined };
    expect(duelNeedsAction(active, 'u2')).toBe(true);
    expect(duelNeedsAction(active, 'u1')).toBe(false);
    expect(duelNeedsAction(match, 'u2')).toBe(false);
  });
});
