import { seed } from '../data/seed';
import { HOUR, MINUTE, refreshOwnership, seasonBounds, seasonKey } from '../domain/rules';
import type { AppData } from '../domain/types';
import { actors, channelId, guilds, visitorId } from './scripts';

export interface Visit {
  eventId: string;
  stage: 'invited' | 'confirmed' | 'present' | 'finished';
  paused: boolean;
  chatter: number;
  awaitingReply: string[];
}

export interface GuildWorld extends AppData {
  dawn: number;
  visits: Record<string, Visit>;
}

export const worldTime = (world: GuildWorld) => world.dawn + world.clockOffset;
export const guestGuild = (world: GuildWorld) =>
  world.memberships.find((m) => m.userId === visitorId)?.communityId;

export function seedGuilds(date = Date.now()): GuildWorld {
  // A mid-season morning leaves room for all six encounters even on a real month boundary.
  const dawn = seasonBounds(seasonKey(date)).start + (14 * 24 + 6) * HOUR;
  const catalog = seed(dawn);
  const world: GuildWorld = {
    id: 'app',
    version: 4,
    dawn,
    clockOffset: 0,
    visits: {},
    communities: catalog.communities,
    points: catalog.points.filter((p) => guilds.some((g) => g.pointId === p.id)),
    users: [
      {
        id: visitorId,
        name: 'Visitante',
        handle: 'visitante',
        bio: 'Explorando as guildas de São Paulo.',
        color: '#00DADB',
        premium: false,
      },
    ],
    presences: [],
    events: [],
    memberships: [],
    messages: [],
    posts: [],
    ownership: [],
    badges: [],
    conversations: [],
    paths: [],
    pathEnrollments: [],
    eventDiscovery: [],
    connections: [],
    duels: [],
    reads: {},
    follows: [],
  };
  for (const [index, script] of guilds.entries()) {
    const community = world.communities.find((c) => c.id === script.communityId)!;
    const host = catalog.users.find((u) => u.id === community.ownerId)!;
    world.users.push(host);
    for (const [i, id] of actors(community.id).entries()) {
      world.users.push({
        id,
        name: script.members[i],
        handle: id,
        color: community.color,
        premium: false,
        bio: script.chatter[i],
        character: {
          hair: i ? 'short' : 'braided',
          outfit: i ? 'vest' : 'cloak',
          background: i ? 'bronze' : 'patina',
          skin: index % 2 ? 'deep' : 'medium',
          face: 'smiling',
        },
      });
    }
    for (const userId of [host.id, ...actors(community.id)])
      world.memberships.push({ userId, communityId: community.id, joinedAt: dawn - 24 * HOUR });
    world.conversations.push({
      id: channelId(community.id),
      communityId: community.id,
      kind: 'channel',
      name: 'Conversa da guilda',
      participantIds: [],
      createdAt: dawn,
    });
    world.posts.push({
      id: 'mural-' + community.id,
      userId: host.id,
      communityId: community.id,
      text: script.notice,
      createdAt: dawn - HOUR,
      likes: [],
      comments: [],
    });
    const rival = world.communities[(index + 1) % guilds.length];
    const start = dawn - 3 * HOUR,
      end = start + 75 * MINUTE;
    world.presences.push({
      id: 'rival-' + community.id,
      userId: rival.ownerId,
      communityId: rival.id,
      pointId: script.pointId,
      source: 'demo',
      startedAt: start,
      endedAt: end,
      lastSampleAt: end,
      lastValid: false,
      intervals: [{ start, end }],
    });
  }
  refreshOwnership(world, dawn);
  return world;
}
