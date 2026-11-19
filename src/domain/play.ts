import type { AppData, CharacterAppearance, Duel, DuelMove, DuelMoves } from './types';
import { isMember } from './rules';

export const characterOptions = {
  hair: { short: 'Curto', braided: 'Trançado', shaved: 'Raspado' },
  outfit: { tunic: 'Túnica', cloak: 'Capa', vest: 'Colete' },
  background: { bronze: 'Rosa', patina: 'Ciano', clay: 'Magenta', stone: 'Noite' },
  skin: { light: 'Clara', medium: 'Média', deep: 'Escura' },
  face: { serene: 'Sereno', smiling: 'Sorridente', bold: 'Marcante' },
  accessory: { none: 'Sem acessório', hoop: 'Argola', pendant: 'Pingente' },
} satisfies {
  [Key in Exclude<keyof CharacterAppearance, 'accessory'>]-?: Record<
    NonNullable<CharacterAppearance[Key]>,
    string
  >;
} & {
  accessory: Record<
    Exclude<NonNullable<CharacterAppearance['accessory']>, `brooch:${string}`>,
    string
  >;
};

export const defaultCharacter: Required<CharacterAppearance> = {
  hair: 'short',
  outfit: 'tunic',
  background: 'bronze',
  skin: 'light',
  face: 'serene',
  accessory: 'none',
};

export function characterLook(value?: CharacterAppearance): Required<CharacterAppearance> {
  return {
    hair: value?.hair ?? defaultCharacter.hair,
    outfit: value?.outfit ?? defaultCharacter.outfit,
    background: value?.background ?? defaultCharacter.background,
    skin: value?.skin ?? defaultCharacter.skin,
    face: value?.face ?? defaultCharacter.face,
    accessory: value?.accessory ?? defaultCharacter.accessory,
  };
}

export function validCharacter(value: CharacterAppearance, data: AppData, userId: string) {
  const look = characterLook(value);
  return (
    Object.hasOwn(characterOptions.hair, value.hair) &&
    Object.hasOwn(characterOptions.outfit, value.outfit) &&
    Object.hasOwn(characterOptions.background, value.background) &&
    Object.hasOwn(characterOptions.skin, look.skin) &&
    Object.hasOwn(characterOptions.face, look.face) &&
    (Object.hasOwn(characterOptions.accessory, look.accessory) ||
      availableBrooches(data, userId).some(
        (community) => `brooch:${community.id}` === look.accessory,
      ))
  );
}

export const XP_PER_LEVEL = 200;
export function communityXpHistory(data: AppData, userId: string, communityId: string) {
  const badges = new Map<string, AppData['badges'][number]>();
  for (const badge of data.badges) {
    if (badge.userId !== userId || badge.communityId !== communityId) continue;
    const previous = badges.get(badge.eventId);
    if (!previous || badge.date < previous.date) badges.set(badge.eventId, badge);
  }
  const entries = [...badges.values()].map((badge) => ({
    kind: 'badge' as 'badge' | 'path',
    id: badge.eventId,
    title: badge.title,
    date: badge.date,
    xp: 100,
  }));
  const completed = new Map<string, (typeof entries)[number]>();
  for (const path of data.paths) {
    if (path.communityId !== communityId || !path.eventIds.every((id) => badges.has(id))) continue;
    const enrollment = data.pathEnrollments.find(
      (entry) => entry.userId === userId && entry.pathId === path.id,
    );
    if (!enrollment) continue;
    const key = JSON.stringify([...path.eventIds].sort());
    const date = Math.max(enrollment.startedAt, ...path.eventIds.map((id) => badges.get(id)!.date));
    const previous = completed.get(key);
    if (!previous || date < previous.date)
      completed.set(key, { kind: 'path', id: path.id, title: path.title, date, xp: 200 });
  }
  return [...entries, ...completed.values()].sort((a, b) => b.date - a.date);
}

export function availableBrooches(data: AppData, userId: string) {
  return data.communities.filter((community) =>
    communityXpHistory(data, userId, community.id).some((entry) => entry.kind === 'path'),
  );
}

export function communityLevel(data: AppData, userId: string, communityId: string) {
  const xp = communityXpHistory(data, userId, communityId).reduce((sum, item) => sum + item.xp, 0);
  return { xp, level: 1 + Math.floor(xp / XP_PER_LEVEL), progress: xp % XP_PER_LEVEL };
}

export function nextCommunityXp(data: AppData, userId: string, communityId: string, now: number) {
  if (!isMember(data, userId, communityId)) return;
  const upcoming = data.events
    .filter((event) => event.communityId === communityId && event.end > now)
    .sort((first, second) => first.start - second.start);
  const invitation = upcoming.find((event) => event.invitedIds.includes(userId));
  if (invitation)
    return { to: `/eventos/${invitation.id}`, label: `Ver encontro: ${invitation.title}` };
  const paths = data.paths.some(
    (path) =>
      path.communityId === communityId &&
      upcoming.some((event) => path.eventIds.includes(event.id)),
  );
  return paths
    ? { to: `/comunidades/${communityId}?tab=caminhos`, label: 'Ver Caminhos da comunidade' }
    : { to: `/comunidades/${communityId}?tab=encontros`, label: 'Ver encontros da comunidade' };
}

export const duelMoveLabels: Record<DuelMove, string> = {
  strength: 'Força',
  guard: 'Guarda',
  wit: 'Astúcia',
};
const beats: Record<DuelMove, DuelMove> = { strength: 'wit', wit: 'guard', guard: 'strength' };

export function defeatedBy(move: DuelMove) {
  return beats[move];
}

export function validDuelMoves(moves: readonly string[]): moves is DuelMoves {
  return moves.length === 3 && [...moves].every((move) => Object.hasOwn(beats, move));
}

export function isDuelPlayer(duel: Duel, userId: string) {
  return duel.challengerId === userId || duel.opponentId === userId;
}

export function duelNeedsAction(duel: Duel, userId: string) {
  if (!isDuelPlayer(duel, userId)) return false;
  if (duel.status === 'pending') return duel.opponentId === userId;
  return (
    duel.status === 'active' &&
    !(duel.challengerId === userId ? duel.challengerMoves : duel.opponentMoves)
  );
}

export function openDuelBetween(data: AppData, first: string, second: string) {
  return data.duels.find(
    (duel) =>
      (duel.status === 'active' || duel.status === 'pending') &&
      isDuelPlayer(duel, first) &&
      isDuelPlayer(duel, second),
  );
}

export function duelResult(duel: Duel) {
  const { challengerMoves, opponentMoves } = duel;
  if (duel.status !== 'finished' || !challengerMoves || !opponentMoves) return;

  const rounds = challengerMoves.map((challengerMove, index) => {
    const opponentMove = opponentMoves[index];
    const winner =
      challengerMove === opponentMove
        ? null
        : beats[challengerMove] === opponentMove
          ? duel.challengerId
          : duel.opponentId;
    return { challengerMove, opponentMove, winner };
  });
  const challengerWins = rounds.filter((round) => round.winner === duel.challengerId).length;
  const opponentWins = rounds.filter((round) => round.winner === duel.opponentId).length;
  const winner =
    challengerWins === opponentWins
      ? null
      : challengerWins > opponentWins
        ? duel.challengerId
        : duel.opponentId;
  return { rounds, challengerWins, opponentWins, winner };
}
