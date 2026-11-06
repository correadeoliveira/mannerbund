import { update } from '../data/database';
import {
  awardBadges,
  canModerate,
  canReadConversation,
  distanceMeters,
  isMember,
  membershipError,
  MINUTE,
  refreshOwnership,
} from '../domain/rules';
import type {
  AppData,
  Clock,
  Community,
  Event,
  LocationSample,
  Point,
  User,
} from '../domain/types';

const id = () => crypto.randomUUID();
const fail = (message: string): never => {
  throw new Error(message);
};
const required = (value: string, label: string, max = 200) => {
  const text = value.trim();
  if (!text) fail(`Preencha ${label}.`);
  if (text.length > max) fail(`${label} deve ter até ${max} caracteres.`);
  return text;
};
const user = (data: AppData, userId: string) =>
  data.users.find((u) => u.id === userId) ?? fail('Perfil não encontrado.');
const admin = (data: AppData, userId: string, communityId: string) => {
  if (!canModerate(data, userId, communityId))
    fail('Somente o administrador desta comunidade pode fazer isso.');
};
const member = (data: AppData, userId: string, communityId: string) => {
  if (!isMember(data, userId, communityId)) fail('Entre nesta comunidade para continuar.');
};
export function createApplication(clock: Clock = { now: () => Date.now() }) {
  const now = (data: AppData) => clock.now() + data.clockOffset;
  function settle(data: AppData) {
    for (const p of data.presences.filter((p) => !p.endedAt && p.eventId)) {
      const event = data.events.find((e) => e.id === p.eventId);
      if (event && event.end <= now(data)) {
        p.endedAt = event.end;
        p.lastValid = false;
      }
    }
    refreshOwnership(data, now(data));
    awardBadges(data, now(data));
  }
  return {
    join: (userId: string, communityId: string) =>
      update((data) => {
        const u = user(data, userId);
        if (!data.communities.some((c) => c.id === communityId)) fail('Comunidade não encontrada.');
        if (isMember(data, userId, communityId)) return;
        const error = membershipError(data, u, 'join');
        if (error) fail(error);
        data.memberships.push({ userId, communityId, joinedAt: now(data) });
      }),
    leave: (userId: string, communityId: string) =>
      update((data) => {
        if (canModerate(data, userId, communityId))
          fail('O criador permanece responsável pela comunidade.');
        data.memberships = data.memberships.filter(
          (m) => !(m.userId === userId && m.communityId === communityId),
        );
        for (const p of data.presences.filter(
          (p) => p.userId === userId && p.communityId === communityId && !p.endedAt,
        ))
          p.endedAt = now(data);
      }),
    removeMember: (actor: string, target: string, communityId: string) =>
      update((data) => {
        admin(data, actor, communityId);
        if (actor === target) fail('Você não pode remover o criador.');
        data.memberships = data.memberships.filter(
          (m) => !(m.userId === target && m.communityId === communityId),
        );
        for (const p of data.presences.filter(
          (p) => p.userId === target && p.communityId === communityId && !p.endedAt,
        ))
          p.endedAt = now(data);
      }),
    createCommunity: (
      userId: string,
      input: Pick<
        Community,
        'name' | 'category' | 'description' | 'color' | 'emblem' | 'cover' | 'preset'
      >,
    ) =>
      update((data) => {
        const error = membershipError(data, user(data, userId), 'own');
        if (error) fail(error);
        const communityId = id();
        data.communities.push({
          ...input,
          name: required(input.name, 'o nome', 60),
          description: required(input.description, 'a descrição', 1000),
          id: communityId,
          ownerId: userId,
          createdAt: now(data),
        });
        data.memberships.push({ userId, communityId, joinedAt: now(data) });
        data.conversations.push({
          id: id(),
          kind: 'channel',
          name: 'Conversa geral',
          communityId,
          participantIds: [],
          createdAt: now(data),
        });
        return communityId;
      }),
    editCommunity: (
      actor: string,
      communityId: string,
      patch: Pick<Community, 'name' | 'description' | 'color' | 'emblem' | 'cover' | 'preset'>,
    ) =>
      update((data) => {
        admin(data, actor, communityId);
        Object.assign(
          data.communities.find((c) => c.id === communityId)!,
          patch,
          {
            name: required(patch.name, 'o nome', 60),
            description: required(patch.description, 'a descrição', 1000),
          },
        );
      }),
    editProfile: (userId: string, patch: Pick<User, 'name' | 'bio' | 'avatar'>) =>
      update((data) =>
        Object.assign(user(data, userId), patch, {
          name: required(patch.name, 'o nome', 60),
          bio: patch.bio.trim().slice(0, 300),
        }),
      ),
    premium: (userId: string) =>
      update((data) => {
        const u = user(data, userId);
        u.premium = !u.premium;
      }),
    follow: (userId: string, target: string) =>
      update((data) => {
        user(data, target);
        if (userId === target) fail('Você não pode seguir o próprio perfil.');
        const existing = data.follows.find((f) => f.from === userId && f.to === target);
        if (existing) data.follows = data.follows.filter((f) => f !== existing);
        else data.follows.push({ from: userId, to: target });
      }),
    createEvent: (actor: string, input: Omit<Event, 'id' | 'acceptedIds'>, eventId?: string) =>
      update((data) => {
        admin(data, actor, input.communityId);
        required(input.title, 'o título', 100);
        required(input.description, 'a descrição', 1500);
        required(input.badgeTitle, 'o título da insígnia', 80);
        required(input.badgeDescription, 'a descrição da insígnia', 500);
        if (!data.points.some((p) => p.id === input.pointId)) fail('Selecione um point válido.');
        if (
          !Number.isFinite(input.start) ||
          !Number.isFinite(input.end) ||
          input.end <= input.start
        )
          fail('O fim precisa ser depois do início.');
        if (
          !Number.isInteger(input.minimumMinutes) ||
          input.minimumMinutes < 1 ||
          input.minimumMinutes * MINUTE > input.end - input.start
        )
          fail('Os minutos da insígnia precisam caber na duração do evento.');
        if (eventId) {
          const event = data.events.find((e) => e.id === eventId) ?? fail('Evento não encontrado.');
          if (event.communityId !== input.communityId)
            fail('Você não pode mover este evento para outra comunidade.');
          if (event.start <= now(data))
            fail('As regras de um evento iniciado não podem ser alteradas.');
          if (input.start <= now(data)) fail('Escolha um início no futuro.');
          Object.assign(event, input, {
            invitedIds: input.invitedIds.filter((u) => isMember(data, u, input.communityId)),
            acceptedIds: event.acceptedIds.filter((u) => input.invitedIds.includes(u)),
          });
          return eventId;
        }
        if (input.start <= now(data)) fail('Escolha um início no futuro.');
        const event = { ...input, id: id(), acceptedIds: [] };
        data.events.push(event);
        return event.id;
      }),
    rsvp: (actor: string, eventId: string) =>
      update((data) => {
        const event = data.events.find((e) => e.id === eventId) ?? fail('Evento não encontrado.');
        member(data, actor, event.communityId);
        if (event.end <= now(data)) fail('Este encontro já terminou.');
        if (!event.invitedIds.includes(actor))
          fail('Você precisa receber um convite do administrador.');
        if (event.acceptedIds.includes(actor))
          event.acceptedIds = event.acceptedIds.filter((u) => u !== actor);
        else event.acceptedIds.push(actor);
      }),
    invite: (actor: string, eventId: string, target: string) =>
      update((data) => {
        const event = data.events.find((e) => e.id === eventId) ?? fail('Evento não encontrado.');
        admin(data, actor, event.communityId);
        member(data, target, event.communityId);
        if (event.end <= now(data)) fail('Este encontro já terminou.');
        if (!event.invitedIds.includes(target)) event.invitedIds.push(target);
      }),
    createPoint: (actor: string, communityId: string, input: Omit<Point, 'id' | 'radius'>) =>
      update((data) => {
        admin(data, actor, communityId);
        if (
          !Number.isFinite(input.lat) ||
          Math.abs(input.lat) > 90 ||
          !Number.isFinite(input.lng) ||
          Math.abs(input.lng) > 180
        )
          fail('Selecione coordenadas válidas no mapa.');
        const near = data.points.find((p) => distanceMeters(p, input) < 100);
        if (near)
          fail(
            `Já existe um point a menos de 100 m: ${near.name}. Selecione esse local para compartilhar a disputa.`,
          );
        const pointId = id();
        data.points.push({
          ...input,
          name: required(input.name, 'o nome do local', 80),
          neighborhood: required(input.neighborhood, 'o bairro', 60),
          id: pointId,
          radius: 100,
        });
        return pointId;
      }),
    startPresence: (
      actor: string,
      pointId: string,
      communityId: string,
      source: 'demo' | 'gps',
      eventId?: string,
    ) =>
      update((data) => {
        member(data, actor, communityId);
        if (data.presences.some((p) => p.userId === actor && !p.endedAt))
          fail('Encerre sua presença atual antes de iniciar outra.');
        if (!data.points.some((p) => p.id === pointId)) fail('Point não encontrado.');
        const t = now(data);
        if (eventId) {
          const event = data.events.find((e) => e.id === eventId) ?? fail('Evento não encontrado.');
          if (event.pointId !== pointId || event.communityId !== communityId)
            fail('O evento não corresponde a este point e comunidade.');
          if (!event.acceptedIds.includes(actor))
            fail('Confirme o convite antes de registrar presença.');
          if (t < event.start || t >= event.end)
            fail('O check-in fica disponível durante o horário do evento.');
        }
        const presenceId = id();
        data.presences.push({
          id: presenceId,
          userId: actor,
          communityId,
          pointId,
          eventId,
          source,
          startedAt: t,
          lastSampleAt: t,
          lastValid: source === 'demo',
          intervals: [],
        });
        return presenceId;
      }),
    endPresence: (actor: string) =>
      update((data) => {
        const p = data.presences.find((p) => p.userId === actor && !p.endedAt);
        if (!p) return;
        p.endedAt = now(data);
        p.lastValid = false;
        settle(data);
      }),
    pausePresence: (actor: string) =>
      update((data) => {
        const p = data.presences.find((p) => p.userId === actor && !p.endedAt);
        if (p) {
          p.lastValid = false;
          p.lastSampleAt = now(data);
        }
      }),
    sample: (actor: string, sample: LocationSample, visible = true) =>
      update((data) => {
        const p = data.presences.find(
          (p) => p.userId === actor && !p.endedAt && p.source === 'gps',
        );
        if (!p) return false;
        const point = data.points.find((point) => point.id === p.pointId)!;
        const t = now(data),
          gap = t - p.lastSampleAt;
        const valid =
          visible &&
          Number.isFinite(sample.lat) &&
          Number.isFinite(sample.lng) &&
          Number.isFinite(sample.accuracy) &&
          sample.accuracy >= 0 &&
          Math.abs(clock.now() - sample.timestamp) <= 15_000 &&
          distanceMeters(point, sample) + sample.accuracy <= point.radius;
        if (valid && p.lastValid && gap > 0 && gap <= 30_000) {
          const event = data.events.find((e) => e.id === p.eventId);
          const start = Math.max(p.lastSampleAt, event?.start ?? -Infinity),
            end = Math.min(t, event?.end ?? Infinity);
          if (end > start) p.intervals.push({ start, end });
        }
        p.lastValid = valid;
        p.lastSampleAt = t;
        const event = data.events.find((e) => e.id === p.eventId);
        if (event && t >= event.end) {
          p.endedAt = event.end;
          p.lastValid = false;
        }
        settle(data);
        return valid;
      }),
    setDemoInside: (actor: string, inside: boolean) =>
      update((data) => {
        const p =
          data.presences.find((p) => p.userId === actor && !p.endedAt && p.source === 'demo') ??
          fail('Inicie uma presença demonstrativa.');
        p.lastValid = inside;
        p.lastSampleAt = now(data);
      }),
    advance: (minutes: number) =>
      update((data) => {
        if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 60 * 24 * 32)
          fail('Escolha um avanço de tempo válido.');
        if (data.presences.some((p) => !p.endedAt && p.source === 'gps'))
          fail('Encerre a presença por GPS antes de avançar o relógio demonstrativo.');
        const start = now(data);
        data.clockOffset += minutes * MINUTE;
        const end = now(data);
        for (const p of data.presences.filter((p) => !p.endedAt && p.source === 'demo')) {
          const event = data.events.find((e) => e.id === p.eventId);
          const a = Math.max(start, event?.start ?? -Infinity),
            b = Math.min(end, event?.end ?? Infinity);
          if (p.lastValid && b > a) p.intervals.push({ start: a, end: b });
          p.lastSampleAt = end;
          if (event && end >= event.end) {
            p.endedAt = event.end;
            p.lastValid = false;
          }
        }
        settle(data);
      }),
    createPost: (actor: string, text: string, image?: string, communityId?: string) =>
      update((data) => {
        user(data, actor);
        if (communityId) admin(data, actor, communityId);
        const postId = id();
        data.posts.push({
          id: postId,
          userId: actor,
          communityId,
          text: required(text, 'o texto da publicação', 3000),
          image,
          createdAt: now(data),
          likes: [],
          comments: [],
        });
        return postId;
      }),
    deletePost: (actor: string, postId: string) =>
      update((data) => {
        const post = data.posts.find((p) => p.id === postId) ?? fail('Publicação não encontrada.');
        if (post.userId !== actor && !canModerate(data, actor, post.communityId))
          fail('Você não pode excluir esta publicação.');
        data.posts = data.posts.filter((p) => p.id !== postId);
      }),
    like: (actor: string, postId: string) =>
      update((data) => {
        const p = data.posts.find((p) => p.id === postId) ?? fail('Publicação não encontrada.');
        p.likes = p.likes.includes(actor)
          ? p.likes.filter((u) => u !== actor)
          : [...p.likes, actor];
      }),
    comment: (actor: string, postId: string, text: string) =>
      update((data) => {
        const p = data.posts.find((p) => p.id === postId) ?? fail('Publicação não encontrada.');
        p.comments.push({
          id: id(),
          userId: actor,
          text: required(text, 'o comentário', 1000),
          createdAt: now(data),
        });
      }),
    createChannel: (actor: string, communityId: string, name: string) =>
      update((data) => {
        admin(data, actor, communityId);
        const clean = required(name, 'o nome do canal', 60);
        if (
          data.conversations.some(
            (c) =>
              c.communityId === communityId &&
              c.name.toLocaleLowerCase() === clean.toLocaleLowerCase(),
          )
        )
          fail('Já existe um canal com esse nome.');
        const conversationId = id();
        data.conversations.push({
          id: conversationId,
          kind: 'channel',
          name: clean,
          communityId,
          participantIds: [],
          createdAt: now(data),
        });
        return conversationId;
      }),
    dm: (actor: string, target: string) =>
      update((data) => {
        user(data, actor);
        user(data, target);
        if (actor === target) fail('Escolha outra pessoa para conversar.');
        const pair = [actor, target].sort();
        const existing = data.conversations.find(
          (c) => c.kind === 'dm' && [...c.participantIds].sort().join(':') === pair.join(':'),
        );
        if (existing) return existing.id;
        const conversationId = id();
        data.conversations.push({
          id: conversationId,
          kind: 'dm',
          name: '',
          participantIds: pair,
          createdAt: now(data),
        });
        return conversationId;
      }),
    send: (actor: string, conversationId: string, text: string) =>
      update((data) => {
        if (!canReadConversation(data, actor, conversationId))
          fail('Você não tem acesso a esta conversa.');
        data.messages.push({
          id: id(),
          conversationId,
          userId: actor,
          text: required(text, 'a mensagem', 4000),
          createdAt: now(data),
        });
        data.reads[`${actor}:${conversationId}`] = now(data);
      }),
    deleteMessage: (actor: string, messageId: string) =>
      update((data) => {
        const message =
          data.messages.find((m) => m.id === messageId) ?? fail('Mensagem não encontrada.');
        const c = data.conversations.find((c) => c.id === message.conversationId)!;
        if (
          !canReadConversation(data, actor, c.id) ||
          (message.userId !== actor && !canModerate(data, actor, c.communityId))
        )
          fail('Você não pode excluir esta mensagem.');
        message.text = '';
        message.deleted = true;
      }),
    markRead: (actor: string, conversationId: string) =>
      update((data) => {
        if (!canReadConversation(data, actor, conversationId)) return;
        data.reads[`${actor}:${conversationId}`] = now(data);
      }),
    settle: () => update((data) => settle(data)),
  };
}
export const app = createApplication();
