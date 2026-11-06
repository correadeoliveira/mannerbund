import type { AppData, Community, Interval, Point, Presence, User } from './types';

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export function seasonKey(time: number): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(time);
  return `${parts.find((p) => p.type === 'year')!.value}-${parts.find((p) => p.type === 'month')!.value}`;
}
export function seasonBounds(key: string): Interval {
  const [year, month] = key.split('-').map(Number);
  return { start: Date.UTC(year, month - 1, 1, 3), end: Date.UTC(year, month, 1, 3) };
}
export function overlap(a: Interval, b: Interval): number {
  return Math.max(0, Math.min(a.end, b.end) - Math.max(a.start, b.start));
}
export function presenceDuration(presence: Presence, window?: Interval): number {
  // Union protects historical imports from counting duplicate/overlapping intervals.
  const sorted = presence.intervals
    .map((i) =>
      window
        ? { start: Math.max(i.start, window.start), end: Math.min(i.end, window.end) }
        : { ...i },
    )
    .filter((i) => i.end > i.start)
    .sort((a, b) => a.start - b.start);
  let total = 0,
    end = -Infinity;
  for (const i of sorted) {
    total += Math.max(0, i.end - Math.max(end, i.start));
    end = Math.max(end, i.end);
  }
  return total;
}
export function distanceMeters(
  a: Pick<Point, 'lat' | 'lng'>,
  b: Pick<Point, 'lat' | 'lng'>,
): number {
  const r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r,
    dLng = (b.lng - a.lng) * r;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
export function membershipError(data: AppData, user: User, kind: 'own' | 'join'): string | null {
  if (user.premium) return null;
  const owned = data.communities.filter((c) => c.ownerId === user.id);
  if (kind === 'own' && owned.length >= 1)
    return 'Seu plano gratuito já tem uma comunidade própria. Ative o Premium demonstrativo para criar outra.';
  if (
    kind === 'join' &&
    data.memberships.some((m) => m.userId === user.id && !owned.some((c) => c.id === m.communityId))
  )
    return 'Você já participa de uma comunidade de outro usuário. Ative o Premium demonstrativo para entrar em mais.';
  return null;
}
export function communityScores(
  data: AppData,
  pointId: string,
  season: string,
): { communityId: string; duration: number }[] {
  const totals = new Map<string, number>();
  for (const p of data.presences.filter((p) => p.pointId === pointId)) {
    const ms = presenceDuration(p, seasonBounds(season));
    if (ms > 0) totals.set(p.communityId, (totals.get(p.communityId) ?? 0) + ms);
  }
  return [...totals]
    .map(([communityId, duration]) => ({ communityId, duration }))
    .sort((a, b) => b.duration - a.duration || a.communityId.localeCompare(b.communityId));
}
export function territoryOwner(data: AppData, pointId: string, season: string): string | undefined {
  const scores = communityScores(data, pointId, season);
  if (!scores.length) return undefined;
  const incumbent = data.ownership.find(
    (o) => o.pointId === pointId && o.season === season,
  )?.communityId;
  return (
    scores.find((s) => s.communityId === incumbent && s.duration === scores[0].duration)
      ?.communityId ?? scores[0].communityId
  );
}
export function refreshOwnership(data: AppData, now: number): void {
  const seasons = new Set([
    seasonKey(now),
    ...data.presences.flatMap((p) =>
      p.intervals.flatMap((i) => [seasonKey(i.start), seasonKey(i.end - 1)]),
    ),
  ]);
  for (const season of seasons)
    for (const point of data.points) {
      const communityId = territoryOwner(data, point.id, season);
      if (!communityId) continue;
      const previous = data.ownership.find((o) => o.pointId === point.id && o.season === season);
      if (previous) {
        if (previous.communityId !== communityId) {
          previous.communityId = communityId;
          previous.changedAt = now;
        }
      } else data.ownership.push({ pointId: point.id, season, communityId, changedAt: now });
    }
}
export function awardBadges(data: AppData, now: number): void {
  for (const event of data.events.filter((e) => e.end <= now)) {
    for (const userId of event.acceptedIds) {
      if (data.badges.some((b) => b.userId === userId && b.eventId === event.id)) continue;
      const duration = data.presences
        .filter((p) => p.userId === userId && p.eventId === event.id)
        .reduce((sum, p) => sum + presenceDuration(p, event), 0);
      if (duration < event.minimumMinutes * MINUTE) continue;
      const community = data.communities.find((c) => c.id === event.communityId)!;
      data.badges.push({
        id: `badge-${event.id}-${userId}`,
        userId,
        eventId: event.id,
        communityId: community.id,
        communityName: community.name,
        eventTitle: event.title,
        title: event.badgeTitle,
        description: event.badgeDescription,
        image: event.badgeImage,
        date: event.end,
      });
    }
  }
}
export function participants(data: AppData, communityId: string, season: string) {
  const totals = new Map<string, number>();
  for (const p of data.presences.filter((p) => p.communityId === communityId)) {
    const ms = presenceDuration(p, seasonBounds(season));
    if (ms) totals.set(p.userId, (totals.get(p.userId) ?? 0) + ms);
  }
  return [...totals]
    .map(([userId, duration]) => ({ userId, duration }))
    .sort((a, b) => b.duration - a.duration || a.userId.localeCompare(b.userId));
}
export function distributeRewards(rows: { userId: string; duration: number }[], pool = 100_000) {
  const positive = rows.filter((r) => r.duration > 0),
    total = positive.reduce((s, r) => s + r.duration, 0);
  if (!total) return [];
  const allocations = positive.map((r) => ({
    ...r,
    cents: Math.floor((pool * r.duration) / total),
    remainder: ((pool * r.duration) / total) % 1,
  }));
  let remaining = pool - allocations.reduce((s, r) => s + r.cents, 0);
  for (const row of [...allocations].sort(
    (a, b) => b.remainder - a.remainder || a.userId.localeCompare(b.userId),
  )) {
    if (remaining-- > 0) row.cents++;
  }
  return allocations;
}
export function canModerate(data: AppData, userId: string, communityId?: string): boolean {
  return (
    !!communityId && data.communities.some((c) => c.id === communityId && c.ownerId === userId)
  );
}
export function isMember(data: AppData, userId: string, communityId: string): boolean {
  return data.memberships.some((m) => m.userId === userId && m.communityId === communityId);
}
export function canReadConversation(
  data: AppData,
  userId: string,
  conversationId: string,
): boolean {
  const c = data.conversations.find((c) => c.id === conversationId);
  return (
    !!c &&
    (c.kind === 'dm' ? c.participantIds.includes(userId) : isMember(data, userId, c.communityId!))
  );
}
export function communityTotal(data: AppData, community: Community, season: string): number {
  return participants(data, community.id, season).reduce((s, r) => s + r.duration, 0);
}
export function formatHours(ms: number): string {
  const min = Math.floor(ms / MINUTE);
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60} min` : ''}`;
}
export const formatNumber = (n: number) => new Intl.NumberFormat('pt-BR').format(n);
export const money = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
export const dateTime = (time: number) =>
  new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(time);
export const timeOnly = (time: number) =>
  new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
  }).format(time);
