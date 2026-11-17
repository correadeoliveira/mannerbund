import { Link, useNavigate } from 'react-router-dom';
import { ChatCircleDotsIcon, UserPlusIcon } from '@phosphor-icons/react';
import { canJoinEventDiscovery, connectionBetween, isDiscoverable } from '../domain/rules';
import type { Event } from '../domain/types';
import { app } from '../services/app';
import { Avatar, Button, Empty, useApp, useBusy } from './ui';
import { DuelChallenge, ProfileDuels } from './Duels';

export function EventConnections({ event }: { event: Event }) {
  const { data, userId, now } = useApp();
  const { busy, run } = useBusy();
  if (!canJoinEventDiscovery(data, event, userId, now)) return null;

  const visible = isDiscoverable(data, event.id, userId);
  const people = visible
    ? data.users.filter(
        (person) => person.id !== userId && isDiscoverable(data, event.id, person.id),
      )
    : [];

  return (
    <section className="event-connections" aria-labelledby="event-connections-heading">
      <div className="section-heading">
        <h2 id="event-connections-heading">Conexões do encontro</h2>
        <Link className="text-link" to="/perfil?tab=conexoes">
          Minhas conexões
        </Link>
      </div>
      <p className="muted">
        {visible
          ? 'Você aparece para as pessoas deste encontro que também escolheram participar.'
          : 'Apareça para outros participantes que também optaram por trocar pedidos de conexão.'}
      </p>
      <Button
        variant={visible ? 'secondary' : 'primary'}
        disabled={busy}
        onClick={() =>
          void run(
            () => app.setEventDiscovery(userId, event.id, !visible),
            visible ? 'Você saiu da lista do encontro.' : 'Você entrou na lista do encontro.',
          )
        }
      >
        {visible ? 'Sair da lista' : 'Aparecer neste encontro'}
      </Button>
      {visible &&
        (people.length ? (
          <ul className="connection-list" role="list">
            {people.map((person) => {
              const connection = connectionBetween(data, userId, person.id);
              return (
                <li className="person-row connection-row" key={person.id}>
                  <Avatar user={person} size={36} />
                  <Link className="person-name" to={`/perfil/${person.id}`}>
                    <strong>{person.name}</strong>
                  </Link>
                  {connection ? (
                    <span className="meta">
                      {connection.status === 'accepted'
                        ? 'Conexão aceita'
                        : connection.from === userId
                          ? 'Pedido enviado'
                          : 'Pedido recebido'}
                    </span>
                  ) : (
                    <Button
                      variant="secondary"
                      aria-label={`Conectar com ${person.name}`}
                      disabled={busy}
                      onClick={() =>
                        void run(
                          () => app.requestConnection(userId, person.id, event.id),
                          'Pedido enviado.',
                        )
                      }
                    >
                      <UserPlusIcon size={16} />
                      Conectar
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="meta connection-empty">Ainda não há outras pessoas na lista.</p>
        ))}
    </section>
  );
}

export function ProfileConnections() {
  const { data, userId } = useApp();
  const { busy, run } = useBusy();
  const navigate = useNavigate();
  const mine = data.connections.filter((item) => item.from === userId || item.to === userId);
  const groups = [
    {
      title: 'Pedidos recebidos',
      items: mine.filter((item) => item.status === 'pending' && item.to === userId),
    },
    {
      title: 'Pedidos enviados',
      items: mine.filter((item) => item.status === 'pending' && item.from === userId),
    },
    { title: 'Pessoas conectadas', items: mine.filter((item) => item.status === 'accepted') },
  ];

  return (
    <section className="profile-connections" aria-labelledby="profile-connections-heading">
      <h2 id="profile-connections-heading">Conexões</h2>
      {mine.length ? (
        groups
          .filter(({ items }) => items.length > 0)
          .map(({ title, items }) => (
            <section className="connection-group" key={title}>
              <h3>{title}</h3>
              <ul className="connection-list" role="list">
                {items.map((item) => {
                  const received = item.to === userId;
                  const person = data.users.find((u) => u.id === (received ? item.from : item.to))!;
                  const event = data.events.find((e) => e.id === item.eventId);
                  return (
                    <li className="person-row connection-row" key={item.id}>
                      <Avatar user={person} size={36} />
                      <div className="person-name">
                        <Link to={`/perfil/${person.id}`}>
                          <strong>{person.name}</strong>
                        </Link>
                        {event && (
                          <Link className="meta" to={`/eventos/${event.id}`}>
                            {event.title}
                          </Link>
                        )}
                      </div>
                      <div className="connection-actions">
                        {item.status === 'accepted' ? (
                          <>
                            <DuelChallenge opponentId={person.id} opponentName={person.name} />
                            <Button
                              variant="secondary"
                              disabled={busy}
                              aria-label={`Conversar com ${person.name}`}
                              onClick={() =>
                                void run(async () => {
                                  const conversationId = await app.dm(userId, person.id);
                                  navigate(`/conversas/${conversationId}`);
                                })
                              }
                            >
                              <ChatCircleDotsIcon size={16} />
                              Conversar
                            </Button>
                          </>
                        ) : (
                          <>
                            {received && (
                              <Button
                                disabled={busy}
                                onClick={() =>
                                  void run(
                                    () => app.acceptConnection(userId, item.id),
                                    'Conexão aceita.',
                                  )
                                }
                              >
                                Aceitar
                              </Button>
                            )}
                            <Button
                              variant="secondary"
                              disabled={busy}
                              onClick={() =>
                                void run(
                                  () => app.dismissConnection(userId, item.id),
                                  received ? 'Pedido recusado.' : 'Pedido cancelado.',
                                )
                              }
                            >
                              {received ? 'Recusar' : 'Cancelar pedido'}
                            </Button>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
      ) : (
        <Empty
          title="Você ainda não tem conexões"
          text="Após registrar presença em um encontro, volte à página dele para escolher se quer aparecer na lista de conexões."
          action={
            <Link className="button button-secondary" to="/comunidades">
              Ver comunidades
            </Link>
          }
        />
      )}
      <ProfileDuels />
    </section>
  );
}
