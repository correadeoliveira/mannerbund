import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRightIcon,
  CompassIcon,
  PlusIcon,
  SparkleIcon,
  UsersThreeIcon,
} from '@phosphor-icons/react';
import { communityTotal, formatHours, isMember, seasonKey } from '../domain/rules';
import { Avatar, Button, Empty, Seal, useApp } from '../components/ui';
import { EventCard } from '../components/EventCard';
import { PostCard } from '../components/PostCard';
import { PostComposer } from '../components/PostComposer';

type HomeTab = 'minha' | 'outras';

export default function HomePage() {
  const { data, now, user, userId } = useApp(),
    [params, setParams] = useSearchParams(),
    [compose, setCompose] = useState(false);
  const tab: HomeTab = params.get('aba') === 'outras' ? 'outras' : 'minha';

  const joined = useMemo(
    () => data.communities.filter((community) => isMember(data, userId, community.id)),
    [data, userId],
  );
  const joinedIds = useMemo(() => new Set(joined.map((community) => community.id)), [joined]);
  const memberIds = useMemo(
    () =>
      new Set([
        userId,
        ...data.memberships
          .filter((membership) => joinedIds.has(membership.communityId))
          .map((membership) => membership.userId),
      ]),
    [data.memberships, joinedIds, userId],
  );

  const myPosts = useMemo(
    () =>
      [...data.posts]
        .filter((post) =>
          post.communityId ? joinedIds.has(post.communityId) : memberIds.has(post.userId),
        )
        .sort((a, b) => b.createdAt - a.createdAt),
    [data.posts, joinedIds, memberIds],
  );
  const otherPosts = useMemo(
    () =>
      [...data.posts]
        .filter((post) => !!post.communityId && !joinedIds.has(post.communityId))
        .sort((a, b) => b.createdAt - a.createdAt),
    [data.posts, joinedIds],
  );
  const nextEvent = useMemo(
    () =>
      data.events
        .filter(
          (event) =>
            event.end > now &&
            (joinedIds.has(event.communityId) || event.invitedIds.includes(userId)),
        )
        .sort((a, b) => a.start - b.start)[0],
    [data.events, joinedIds, now, userId],
  );
  const season = seasonKey(now),
    collective = joined.reduce(
      (sum, community) => sum + communityTotal(data, community, season),
      0,
    ),
    communityNames =
      joined.length > 2
        ? `${joined
            .slice(0, 2)
            .map((community) => community.name)
            .join(' · ')} e mais ${joined.length - 2} ${
            joined.length - 2 === 1 ? 'comunidade' : 'comunidades'
          }`
        : joined.map((community) => community.name).join(' · ');

  const setTab = (next: HomeTab) =>
    setParams(next === 'minha' ? {} : { aba: 'outras' }, { replace: true });

  return (
    <div className="content-page home-page">
      <header className="home-heading">
        <div>
          <span className="home-kicker">
            <SparkleIcon size={13} weight="fill" />
            Seu lugar é com gente
          </span>
          <h1>O que está acontecendo.</h1>
          <p>
            {tab === 'minha'
              ? joined.length
                ? `As histórias de ${communityNames} chegam aqui primeiro.`
                : 'Descubra uma comunidade para começar a acompanhar histórias de perto.'
              : 'Veja o que outras comunidades estão vivendo antes de fazer parte.'}
          </p>
        </div>
        <Link className="button button-secondary home-discover" to="/comunidades">
          <CompassIcon size={18} />
          Descobrir comunidades
        </Link>
      </header>

      <div className="home-tabs" role="tablist" aria-label="Escolher feed">
        <button
          id="home-tab-minha"
          type="button"
          role="tab"
          aria-selected={tab === 'minha'}
          aria-controls="home-feed"
          onClick={() => setTab('minha')}
        >
          Minha comunidade
          <span className="home-tab-count">{myPosts.length}</span>
        </button>
        <button
          id="home-tab-outras"
          type="button"
          role="tab"
          aria-selected={tab === 'outras'}
          aria-controls="home-feed"
          onClick={() => setTab('outras')}
        >
          Outras comunidades
          <span className="home-tab-count">{otherPosts.length}</span>
        </button>
      </div>

      <div className="home-layout">
        <section
          className="home-feed"
          id="home-feed"
          role="tabpanel"
          aria-labelledby={`home-tab-${tab}`}
        >
          {tab === 'minha' && joined.length > 0 && (
            <button className="composer-trigger home-composer" onClick={() => setCompose(true)}>
              <Avatar user={user} />
              <span>O que você viveu hoje?</span>
              <PlusIcon size={20} />
            </button>
          )}

          <div className="feed-sort">
            <span>
              {tab === 'minha' ? 'Histórias da sua comunidade' : 'Comunidades para descobrir'}
            </span>
            <span>Mais recentes primeiro</span>
          </div>

          {tab === 'minha' ? (
            myPosts.length ? (
              myPosts.map((post) => <PostCard key={post.id} post={post} />)
            ) : (
              <Empty
                title={
                  joined.length ? 'A primeira história pode ser sua' : 'Sua comunidade começa aqui'
                }
                text={
                  joined.length
                    ? 'Compartilhe um encontro ou uma descoberta com quem caminha com você.'
                    : 'Encontre uma turma que combina com você e acompanhe tudo de perto.'
                }
                action={
                  joined.length ? (
                    <Button onClick={() => setCompose(true)}>
                      <PlusIcon size={17} />
                      Compartilhar história
                    </Button>
                  ) : (
                    <Link className="button button-primary" to="/comunidades">
                      Encontrar comunidade
                    </Link>
                  )
                }
              />
            )
          ) : otherPosts.length ? (
            otherPosts.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <Empty
              title="Você já está em todas as conversas"
              text="Quando uma nova comunidade publicar, as histórias aparecem aqui."
              action={
                <Link className="button button-secondary" to="/comunidades">
                  Ver todas as comunidades
                </Link>
              }
            />
          )}
        </section>

        <aside className="home-rail" aria-label="Resumo da sua comunidade">
          <div className="side-block">
            <div className="section-heading">
              <h2>Suas comunidades</h2>
              <Link className="text-link" to="/comunidades">
                Ver todas
              </Link>
            </div>
            {joined.length ? (
              joined.map((community) => (
                <Link
                  className="home-community-row"
                  to={`/comunidades/${community.id}`}
                  key={community.id}
                >
                  <Seal community={community} size={36} />
                  <span>
                    <strong>{community.name}</strong>
                    <small>
                      {data.memberships.filter((m) => m.communityId === community.id).length}{' '}
                      membros
                    </small>
                  </span>
                  <ArrowRightIcon size={16} aria-hidden="true" />
                </Link>
              ))
            ) : (
              <p className="home-rail-empty">
                Você ainda não faz parte de uma comunidade.{' '}
                <Link className="inline-link" to="/comunidades">
                  Encontrar uma
                </Link>
                .
              </p>
            )}
          </div>

          <div className="side-block">
            <div className="section-heading">
              <h2>Próximo encontro</h2>
              <Link className="text-link" to="/comunidades">
                Ver agenda
              </Link>
            </div>
            {nextEvent ? (
              <EventCard event={nextEvent} compact />
            ) : (
              <div className="home-rail-empty">
                <UsersThreeIcon size={22} />
                <p>Nenhum encontro marcado por enquanto.</p>
              </div>
            )}
          </div>

          <div className="side-block home-month">
            <span className="meta">Sua temporada</span>
            <strong>{formatHours(collective)}</strong>
            <p>de presença coletiva neste mês.</p>
            <Link className="text-link" to="/temporada">
              Ver ranking
              <ArrowRightIcon size={15} />
            </Link>
          </div>
        </aside>
      </div>

      {compose && <PostComposer onClose={() => setCompose(false)} />}
    </div>
  );
}
