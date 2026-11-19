import { HOUR, MINUTE, territoryOwner, seasonBounds, seasonKey, timeOnly } from '../domain/rules';
import type { CharacterAppearance } from '../domain/types';
import { createApplication } from '../services/app';
import { guildDb, type GuildDatabase } from './repository';
import { actors, channelId, guilds, replyTo, visitorId } from './scripts';
import { guestGuild, worldTime, type GuildWorld, type Visit } from './world';

function scriptFor(id: string) {
  const script = guilds.find((g) => g.communityId === id);
  if (!script) throw new Error('Guilda não encontrada.');
  return script;
}

export function nextCue(visit?: Visit) {
  if (!visit || visit.paused || visit.stage === 'finished') return undefined;
  if (visit.awaitingReply.length) return 'resposta-' + visit.awaitingReply[0];
  if (visit.chatter < 2) return 'conversa-' + visit.chatter;
}

// Each scripted step and its real application commands share one IndexedDB transaction.
function commands(world: GuildWorld) {
  return createApplication({ now: () => world.dawn }, async (fn) => fn(world));
}
function currentVisit(world: GuildWorld, id: string) {
  const visit = world.visits[id];
  if (!visit || guestGuild(world) !== id) throw new Error('Faça parte desta comunidade primeiro.');
  return visit;
}
function running(visit: Visit) {
  if (visit.paused) throw new Error('Retome a simulação para continuar o encontro.');
}
function nextStart(now: number, hour: number) {
  const day = 24 * HOUR;
  const midnight = now - ((now - seasonBounds(seasonKey(now)).start) % day);
  const slot = midnight + hour * HOUR;
  return slot > now ? slot : slot + day;
}
async function advance(world: GuildWorld, activeId: string, minutes: number) {
  // A dormant invitation keeps its local meeting hour on the next simulated day.
  const until = worldTime(world) + minutes * MINUTE;
  for (const [id, visit] of Object.entries(world.visits)) {
    if (id === activeId || visit.stage === 'finished') continue;
    const event = world.events.find((e) => e.id === visit.eventId)!;
    if (event.start > until) continue;
    event.start = nextStart(until, scriptFor(id).hour);
    event.end = event.start + 30 * MINUTE;
  }
  await commands(world).advance(minutes);
}
async function finish(world: GuildWorld, id: string, minutes: 0 | 10 | 30) {
  const visit = currentVisit(world, id);
  if (visit.stage === 'finished') return;
  if (visit.stage !== 'present') throw new Error('Faça o check-in para participar do encontro.');
  const app = commands(world),
    script = scriptFor(id);
  if (minutes) await advance(world, id, minutes);
  if (minutes < 30) {
    await app.endPresence(visitorId);
    await advance(world, id, 30 - minutes);
  }
  const host = world.communities.find((c) => c.id === id)!.ownerId;
  const won = territoryOwner(world, script.pointId, seasonKey(worldTime(world))) === id;
  await app.createPost(
    host,
    script.closing +
      (won
        ? ' Hoje conquistamos este território juntos!'
        : ' O território continua com a guilda rival. Até a próxima!'),
    undefined,
    id,
  );
  visit.stage = 'finished';
  visit.awaitingReply = [];
}

export function createGuildExperience(db: Pick<GuildDatabase, 'change'>) {
  return {
    join: (id: string, leaving?: string) =>
      db.change(async (world) => {
        const script = scriptFor(id),
          previous = guestGuild(world),
          app = commands(world);
        if (previous === id) return;
        if (previous) {
          if (leaving !== previous) throw new Error('Confirme a saída da sua guilda atual.');
          if (world.visits[previous].stage === 'present') await finish(world, previous, 0);
          await app.leave(visitorId, previous);
        }
        await app.join(visitorId, id);
        if (world.visits[id]) return;
        const host = world.communities.find((c) => c.id === id)!.ownerId;
        const start = nextStart(worldTime(world), script.hour);
        const eventId = await app.createEvent(host, {
          communityId: id,
          pointId: script.pointId,
          title: script.title,
          description: script.meeting,
          start,
          end: start + 30 * MINUTE,
          minimumMinutes: 30,
          badgeTitle: script.badge,
          badgeImage: script.badgeImage,
          badgeDescription: script.memory,
          invitedIds: [...actors(id)],
        });
        await app.invite(host, eventId, visitorId);
        await app.send(host, channelId(id), script.welcome);
        world.visits[id] = {
          eventId,
          stage: 'invited',
          paused: false,
          chatter: 0,
          awaitingReply: [],
        };
      }),
    pause: (id: string, paused: boolean) =>
      db.change(async (world) => {
        const visit = currentVisit(world, id);
        if (visit.stage !== 'finished') visit.paused = paused;
      }),
    chat: (id: string, text: string) =>
      db.change(async (world) => {
        const visit = currentVisit(world, id);
        if (visit.stage === 'finished') throw new Error('A conversa deste encontro terminou.');
        await commands(world).send(visitorId, channelId(id), text);
        visit.awaitingReply.push(world.messages.at(-1)!.id);
      }),
    cue: (id: string, expected: string) =>
      db.change(async (world) => {
        const visit = world.visits[id];
        if (guestGuild(world) !== id || nextCue(visit) !== expected) return;
        const script = scriptFor(id),
          app = commands(world);
        const messageId = visit.awaitingReply.shift();
        if (messageId) {
          const message = world.messages.find((m) => m.id === messageId)!;
          const event = world.events.find((e) => e.id === visit.eventId)!;
          await app.send(
            actors(id)[0],
            channelId(id),
            replyTo(script, message.text, timeOnly(event.start)),
          );
        } else {
          const index = visit.chatter++;
          await app.send(actors(id)[index], channelId(id), script.chatter[index]);
        }
      }),
    confirm: (id: string) =>
      db.change(async (world) => {
        const visit = currentVisit(world, id);
        if (visit.stage !== 'invited') return;
        running(visit);
        const app = commands(world);
        for (const actor of [visitorId, ...actors(id)]) await app.rsvp(actor, visit.eventId);
        await app.send(actors(id)[1], channelId(id), 'Também confirmei. Nos vemos lá!');
        visit.stage = 'confirmed';
      }),
    arrive: (id: string) =>
      db.change(async (world) => {
        const visit = currentVisit(world, id);
        if (visit.stage === 'present' || visit.stage === 'finished') return;
        running(visit);
        if (visit.stage !== 'confirmed') throw new Error('Confirme o convite antes de chegar.');
        const app = commands(world),
          script = scriptFor(id);
        const event = world.events.find((e) => e.id === visit.eventId)!;
        await advance(world, id, (event.start - worldTime(world)) / MINUTE);
        for (const actor of [...actors(id), visitorId])
          await app.startPresence(actor, script.pointId, id, 'demo', event.id);
        visit.stage = 'present';
      }),
    finish: (id: string, minutes: 10 | 30) =>
      db.change(async (world) => {
        running(currentVisit(world, id));
        await finish(world, id, minutes);
      }),
    rename: (name: string) =>
      db.change(async (world) => {
        const user = world.users.find((u) => u.id === visitorId)!;
        await commands(world).editProfile(user.id, { ...user, name });
      }),
    dress: (appearance: CharacterAppearance) =>
      db.change(async (world) => {
        await commands(world).editCharacter(visitorId, appearance);
      }),
  };
}
export const experience = createGuildExperience(guildDb);
