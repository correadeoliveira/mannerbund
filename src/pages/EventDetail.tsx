import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  CalendarBlankIcon,
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon,
  PencilSimpleIcon,
  PlayCircleIcon,
  TrophyIcon,
  UserPlusIcon,
} from '@phosphor-icons/react';
import { dateTime, formatHours, isMember, MINUTE, presenceDuration } from '../domain/rules';
import { app } from '../services/app';
import { act } from '../state/ui';
import { Avatar, Button, Empty, Media, Seal, useApp } from '../components/ui';
import { PresenceDialog } from '../components/PresenceDialog';
import { EventForm } from '../components/EventForm';

export default function EventDetail() {
  const { id } = useParams(),
    { data, userId, now } = useApp(),
    [presence, setPresence] = useState(false),
    [edit, setEdit] = useState(false);
  const event = data.events.find((e) => e.id === id);
  if (!event)
    return (
      <Empty
        title="Encontro não encontrado"
        text="Volte às comunidades para encontrar seu próximo encontro."
        action={<Link to="/comunidades">Ver comunidades</Link>}
      />
    );
  const c = data.communities.find((c) => c.id === event.communityId)!,
    p = data.points.find((p) => p.id === event.pointId)!,
    owner = c.ownerId === userId,
    accepted = event.acceptedIds.includes(userId),
    invited = event.invitedIds.includes(userId),
    joined = isMember(data, userId, c.id),
    ended = event.end <= now,
    started = event.start <= now;
  const awarded = data.badges.find((b) => b.eventId === event.id && b.userId === userId),
    duration = data.presences
      .filter((p) => p.eventId === event.id && p.userId === userId)
      .reduce((s, p) => s + presenceDuration(p, event), 0),
    active = data.presences.find((p) => p.userId === userId && !p.endedAt);
  return (
    <div className="content-page event-detail">
      <Link to={`/comunidades/${c.id}`} className="back-link">
        {c.name}
        <span>/</span>Encontro
      </Link>
      <div className="event-detail-grid">
        <section>
          <div className="event-cover">
            <Media src={c.cover} alt={`Capa ilustrativa de ${c.name}`} />
            <span className={`event-state ${started && !ended ? 'event-live' : ''}`}>
              {ended
                ? 'Uma história que ficou'
                : started
                  ? 'O encontro está acontecendo'
                  : 'O próximo encontro'}
            </span>
          </div>
          <div className="event-title-row">
            <Link to={`/comunidades/${c.id}`} className="community-inline">
              <Seal community={c} size={32} />
              {c.name}
            </Link>
            {owner && !started && (
              <Button variant="secondary" onClick={() => setEdit(true)}>
                <PencilSimpleIcon size={16} />
                Editar
              </Button>
            )}
          </div>
          <h1>{event.title}</h1>
          <div className="event-detail-meta">
            <span>
              <CalendarBlankIcon size={20} />
              <span>
                {dateTime(event.start)}
                <small>Até {dateTime(event.end)} · horário de São Paulo</small>
              </span>
            </span>
            <Link to={`/?point=${p.id}`}>
              <MapPinIcon size={20} />
              <span>
                {p.name}
                <small>
                  {p.neighborhood} · raio de {p.radius} metros
                </small>
              </span>
            </Link>
          </div>
          <div className="event-description">
            <h2>Vamos viver isso juntos.</h2>
            <p>{event.description}</p>
          </div>
          <div className="section-heading">
            <h2>Quem vai estar lá</h2>
            <span className="meta">{event.acceptedIds.length} confirmados</span>
          </div>
          <div className="attendee-list">
            {event.acceptedIds.map((id) => {
              const u = data.users.find((u) => u.id === id)!;
              return (
                <Link key={id} to={`/perfil/${id}`}>
                  <Avatar user={u} size={48} />
                  <span>{u.name.split(' ')[0]}</span>
                </Link>
              );
            })}
          </div>
          {owner && (
            <div className="event-invites">
              <h3>Convites da comunidade</h3>
              {data.memberships
                .filter((m) => m.communityId === c.id)
                .map((m) => {
                  const u = data.users.find((u) => u.id === m.userId)!;
                  return (
                    <div className="person-row" key={u.id}>
                      <Avatar user={u} size={32} />
                      <span className="person-name">{u.name}</span>
                      {event.invitedIds.includes(u.id) ? (
                        <span className="meta">
                          {event.acceptedIds.includes(u.id) ? 'Confirmado' : 'Convite enviado'}
                        </span>
                      ) : (
                        <Button
                          variant="secondary"
                          disabled={ended}
                          onClick={() =>
                            void act(
                              () => app.invite(userId, event.id, u.id),
                              'Convite disponível para o membro.',
                            )
                          }
                        >
                          <UserPlusIcon size={16} />
                          Convidar
                        </Button>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </section>
        <aside className="event-aside">
          <div className="badge-preview">
            <Media src={event.badgeImage} alt={`Medalhão da insígnia ${event.badgeTitle}`} />
            <div className="badge-preview-text">
              <TrophyIcon size={20} />
              <h2>{event.badgeTitle}</h2>
              <p>{event.badgeDescription}</p>
              <span className="badge-requirement">
                <ClockIcon size={16} />
                {event.minimumMinutes} minutos de presença
              </span>
            </div>
          </div>
          <div className="event-rsvp">
            <h3>
              {awarded
                ? 'Uma conquista para chamar de sua.'
                : ended
                  ? 'Este encontro terminou.'
                  : 'Seu lugar está reservado?'}
            </h3>
            {awarded ? (
              <>
                <p className="notice success">
                  <CheckCircleIcon size={19} />
                  Sua insígnia já está no perfil.
                </p>
                <Link className="button button-primary full-width" to="/perfil?tab=trofeus">
                  Ver minha conquista
                </Link>
              </>
            ) : !joined ? (
              <>
                <p>Faça parte da comunidade para receber convites e participar.</p>
                <Button
                  className="full-width"
                  onClick={() =>
                    void act(
                      () => app.join(userId, c.id),
                      'Você entrou na comunidade. O ADM pode convidar você.',
                    )
                  }
                  disabled={ended}
                >
                  Fazer parte da comunidade
                </Button>
              </>
            ) : !invited ? (
              <p className="notice">O administrador precisa convidar você para este encontro.</p>
            ) : !ended ? (
              <>
                <p>
                  {accepted
                    ? 'Convite confirmado. Agora é só chegar e registrar sua presença.'
                    : 'Confirme o convite e escreva o próximo capítulo com a comunidade.'}
                </p>
                <Button
                  variant={accepted ? 'secondary' : 'primary'}
                  className="full-width"
                  onClick={() =>
                    void act(
                      () => app.rsvp(userId, event.id),
                      accepted ? 'Confirmação cancelada.' : 'Convite confirmado. Nos vemos lá!',
                    )
                  }
                >
                  {accepted ? (
                    <>
                      <CheckCircleIcon size={18} />
                      Presença confirmada
                    </>
                  ) : (
                    'Confirmar convite'
                  )}
                </Button>
                {accepted && (
                  <Button
                    className="full-width"
                    disabled={!started || !!active}
                    onClick={() => setPresence(true)}
                  >
                    <MapPinIcon size={18} />
                    {active
                      ? 'Você já tem uma presença ativa'
                      : started
                        ? 'Registrar presença'
                        : 'Check-in no horário do encontro'}
                  </Button>
                )}
              </>
            ) : (
              <p>
                {duration >= event.minimumMinutes * MINUTE
                  ? 'Sua presença foi registrada.'
                  : 'Você não atingiu o tempo mínimo para esta insígnia.'}
              </p>
            )}
            {duration > 0 && (
              <div className="attendance-progress">
                <div>
                  <span>Seu tempo no encontro</span>
                  <strong>{formatHours(duration)}</strong>
                </div>
                <progress
                  value={Math.min(duration, event.minimumMinutes * MINUTE)}
                  max={event.minimumMinutes * MINUTE}
                />
              </div>
            )}
            {!started && (
              <button
                className="demo-time-button"
                onClick={() =>
                  void act(
                    () => app.advance(Math.max(1, Math.ceil((event.start - now) / MINUTE))),
                    'Relógio demonstrativo avançado até o encontro.',
                  )
                }
              >
                <PlayCircleIcon size={17} />
                Demonstração: avançar até o início
              </button>
            )}
            {started && !ended && (
              <button
                className="demo-time-button"
                onClick={() =>
                  void act(
                    () => app.advance(Math.max(1, Math.ceil((event.end - now) / MINUTE))),
                    'Encontro encerrado no relógio demonstrativo.',
                  )
                }
              >
                <PlayCircleIcon size={17} />
                Demonstração: avançar até o fim
              </button>
            )}
            <p className="microcopy">
              Convite confirmado + presença dentro da área e do horário = uma memória no seu perfil.
            </p>
          </div>
        </aside>
      </div>
      {presence && <PresenceDialog point={p} event={event} onClose={() => setPresence(false)} />}{' '}
      {edit && <EventForm communityId={c.id} event={event} onClose={() => setEdit(false)} />}
    </div>
  );
}
