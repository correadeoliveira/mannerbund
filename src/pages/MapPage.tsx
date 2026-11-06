import { lazy, Suspense, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRightIcon,
  CaretRightIcon,
  CrosshairIcon,
  MapPinIcon,
  MagnifyingGlassIcon,
  UsersThreeIcon,
  CompassIcon,
  XIcon,
  TrophyIcon,
  ClockIcon,
} from '@phosphor-icons/react';
import {
  communityScores,
  communityTotal,
  formatHours,
  isMember,
  seasonKey,
  territoryOwner,
} from '../domain/rules';
import type { Community } from '../domain/types';
import { useApp, Button, Seal, Avatar, Empty, IconButton } from '../components/ui';
import { EventCard } from '../components/EventCard';
import { PresenceDialog } from '../components/PresenceDialog';
import { browserLocation } from '../services/location';
import { useUI } from '../state/ui';
import { accessibleAccent } from '../lib/colors';

const MapCanvas = lazy(() => import('../components/MapCanvas'));
export default function MapPage() {
  const { data, now, userId } = useApp(),
    [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(''),
    [filter, setFilter] = useState('all'),
    [showPresence, setShowPresence] = useState(false),
    [mobileDetail, setMobileDetail] = useState(false),
    [location, setLocation] = useState<{ lat: number; lng: number }>(),
    [locating, setLocating] = useState(false);
  const selected = data.points.find((p) => p.id === params.get('point')) ?? data.points[0],
    season = seasonKey(now);
  const owners = useMemo(
    () =>
      Object.fromEntries(
        data.points.map((p) => [
          p.id,
          data.communities.find((c) => c.id === territoryOwner(data, p.id, season)),
        ]),
      ) as Record<string, Community | undefined>,
    [data, season],
  );
  const points = useMemo(
    () =>
      data.points.filter((p) => {
        const matches = `${p.name} ${p.neighborhood} ${owners[p.id]?.name ?? ''}`
          .toLocaleLowerCase()
          .includes(query.toLocaleLowerCase());
        if (!matches) return false;
        if (filter === 'mine') return owners[p.id] && isMember(data, userId, owners[p.id]!.id);
        if (filter === 'events') return data.events.some((e) => e.pointId === p.id && e.end > now);
        return filter === 'all' || owners[p.id]?.id === filter;
      }),
    [data, query, filter, owners, userId, now],
  );
  const owner = owners[selected.id],
    scores = communityScores(data, selected.id, season),
    total = scores.reduce((s, r) => s + r.duration, 0),
    events = data.events
      .filter((e) => e.pointId === selected.id && e.end > now)
      .sort((a, b) => a.start - b.start);
  const ownCommunities = data.communities.filter((c) => isMember(data, userId, c.id));
  const select = (pointId: string) => {
    setParams({ point: pointId });
    setMobileDetail(true);
  };
  const locate = () => {
    setLocating(true);
    let stop = () => {};
    const timer = setTimeout(() => {
      stop();
      setLocating(false);
    }, 16000);
    stop = browserLocation.watch(
      (sample) => {
        setLocation(sample);
        setLocating(false);
        stop();
        clearTimeout(timer);
      },
      (error) => {
        useUI.getState().notify(error, true);
        setLocating(false);
        stop();
        clearTimeout(timer);
      },
    );
  };
  return (
    <div className="map-page">
      <div className="map-heading">
        <div>
          <h1>Encontre seu lugar.</h1>
          <p>As pessoas se encontram. Os lugares ganham história.</p>
        </div>
        <Link className="season-link" to="/temporada">
          <TrophyIcon size={18} />
          <span>
            Temporada de{' '}
            {new Intl.DateTimeFormat('pt-BR', {
              month: 'long',
              timeZone: 'America/Sao_Paulo',
            }).format(now)}
          </span>
          <CaretRightIcon size={15} />
        </Link>
      </div>
      <div className="map-layout">
        <section className="map-section">
          <div className="map-toolbar">
            <label className="search-field">
              <MagnifyingGlassIcon size={19} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Encontre um território ou comunidade"
                aria-label="Buscar território ou comunidade"
              />
            </label>
            <IconButton
              label={locating ? 'Localizando…' : 'Usar minha localização'}
              disabled={locating}
              onClick={locate}
            >
              <CrosshairIcon size={20} />
            </IconButton>
          </div>
          <div className="map-filters">
            <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
              Todos os territórios
            </button>
            <button className={filter === 'mine' ? 'active' : ''} onClick={() => setFilter('mine')}>
              Minhas comunidades
            </button>
            <button
              className={filter === 'events' ? 'active' : ''}
              onClick={() => setFilter('events')}
            >
              Com encontros
            </button>
            <select
              aria-label="Filtrar por comunidade"
              value={data.communities.some((c) => c.id === filter) ? filter : ''}
              onChange={(e) => setFilter(e.target.value || 'all')}
            >
              <option value="">Comunidade</option>
              {data.communities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="map-frame">
            <Suspense
              fallback={
                <div className="map-loading">
                  <span className="spinner" />
                  Preparando o mapa…
                </div>
              }
            >
              <MapCanvas
                points={points}
                owners={owners}
                selected={selected.id}
                onSelect={select}
                location={location}
              />
            </Suspense>
            <div className="map-city-label">
              <span>São Paulo</span>
              <small>Uma cidade. Muitos encontros.</small>
            </div>
            <div className="map-legend">
              <span className="legend-dot" />
              Territórios de comunidades<span className="legend-count">{points.length} locais</span>
            </div>
            <button
              className="map-how"
              onClick={() =>
                useUI
                  .getState()
                  .notify(
                    'Domínio = soma das horas de presença da comunidade neste local durante o mês. Só supera quem soma mais.',
                  )
              }
            >
              <CompassIcon size={17} />
              Como conquistar?
            </button>
          </div>
          <div className="point-strip" aria-label="Lista de territórios">
            {points.length ? (
              points.map((p) => (
                <button
                  key={p.id}
                  className={p.id === selected.id ? 'point-mini selected' : 'point-mini'}
                  onClick={() => select(p.id)}
                >
                  {owners[p.id] ? (
                    <Seal community={owners[p.id]!} size={32} />
                  ) : (
                    <MapPinIcon size={24} />
                  )}
                  <span>
                    <strong>{p.name}</strong>
                    <small>{owners[p.id]?.name ?? 'Território livre'}</small>
                  </span>
                  <CaretRightIcon size={14} />
                </button>
              ))
            ) : (
              <p className="muted">Nenhum local com esse filtro. Tente outra busca.</p>
            )}
          </div>
        </section>
        <aside className={`territory-panel ${mobileDetail ? 'mobile-detail-open' : ''}`}>
          <div className="panel-section territory-intro">
            <div className="section-heading">
              <span className="muted">Seu próximo encontro começa aqui</span>
              <IconButton
                label="Fechar detalhes do território"
                className="mobile-close"
                onClick={() => setMobileDetail(false)}
              >
                <XIcon size={19} />
              </IconButton>
            </div>
            <div className="territory-owner">
              {owner ? <Seal community={owner} size={56} /> : <MapPinIcon size={42} />}
              <div>
                <span className="meta">{owner ? 'Território de' : 'Um lugar para começar'}</span>
                {owner && (
                  <Link to={`/comunidades/${owner.id}`}>
                    {owner.name}
                    <CaretRightIcon size={14} />
                  </Link>
                )}
              </div>
            </div>
            <h2>{selected.name}</h2>
            <p className="meta">
              <MapPinIcon size={15} />
              {selected.neighborhood}, São Paulo
            </p>
            <div className="territory-facts">
              <div>
                <strong>{formatHours(total)}</strong>
                <span>de presença coletiva</span>
              </div>
              <div>
                <strong>
                  {
                    new Set(
                      data.presences
                        .filter(
                          (p) =>
                            p.pointId === selected.id &&
                            p.intervals.some((i) => seasonKey(i.start) === season),
                        )
                        .map((p) => p.userId),
                    ).size
                  }
                </strong>
                <span>pessoas neste mês</span>
              </div>
            </div>
            {!!scores.length && (
              <div className="territory-contenders">
                <div className="section-heading">
                  <h3>A disputa do lugar</h3>
                  <span className="meta">Neste mês</span>
                </div>
                <div className="score-track">
                  {scores.map((s) => (
                    <div
                      key={s.communityId}
                      style={{
                        width: `${(s.duration / total) * 100}%`,
                        background: accessibleAccent(
                          data.communities.find((c) => c.id === s.communityId)?.color ?? '#A7A798',
                        ),
                      }}
                      title={`${data.communities.find((c) => c.id === s.communityId)?.name}: ${formatHours(s.duration)}`}
                    />
                  ))}
                </div>
                {scores.map((s, index) => {
                  const c = data.communities.find((c) => c.id === s.communityId)!;
                  return (
                    <div key={s.communityId} className="contender-row">
                      <span className="rank-number">{index + 1}</span>
                      <span
                        className="color-dot"
                        style={{ background: accessibleAccent(c.color) }}
                      />
                      <Link to={`/comunidades/${c.id}`}>{c.name}</Link>
                      <strong>{formatHours(s.duration)}</strong>
                    </div>
                  );
                })}
                <p className="microcopy">
                  O domínio muda quando outra comunidade supera as horas do líder. Empates mantêm o
                  território.
                </p>
              </div>
            )}
            <Button
              className="full-width"
              disabled={!ownCommunities.length}
              onClick={() => setShowPresence(true)}
            >
              <MapPinIcon size={18} />
              Registrar minha presença
              <ArrowRightIcon size={17} />
            </Button>
            {!ownCommunities.length && (
              <Link className="text-link" to="/comunidades">
                Entre em uma comunidade primeiro
              </Link>
            )}
          </div>
          <div className="panel-section">
            <div className="section-heading">
              <h3>Próximos encontros</h3>
              <span className="count-label">{events.length}</span>
            </div>
            {events.length ? (
              events.slice(0, 2).map((e) => <EventCard key={e.id} event={e} compact />)
            ) : (
              <div className="small-empty">
                <ClockIcon size={22} />
                <span>Ainda sem encontro marcado neste local.</span>
              </div>
            )}
          </div>
          <div className="panel-section my-communities">
            <div className="section-heading">
              <h3>Suas comunidades</h3>
              <Link to="/comunidades" aria-label="Ver comunidades">
                <ArrowUpIcon />
              </Link>
            </div>
            {ownCommunities.length ? (
              ownCommunities.map((c) => (
                <Link className="community-mini" key={c.id} to={`/comunidades/${c.id}`}>
                  <Seal community={c} size={36} />
                  <span>
                    <strong>{c.name}</strong>
                    <small>{formatHours(communityTotal(data, c, season))} juntos neste mês</small>
                  </span>
                  <CaretRightIcon size={15} />
                </Link>
              ))
            ) : (
              <Empty title="Encontre sua turma" text="Há um lugar esperando por você." />
            )}
            <div className="together-line">
              <div className="avatar-stack">
                {data.users.slice(0, 3).map((u) => (
                  <Avatar key={u.id} user={u} size={25} />
                ))}
              </div>
              <span>Histórias construídas juntos.</span>
            </div>
          </div>
        </aside>
      </div>
      <div className="map-bottom-note">
        <UsersThreeIcon size={15} />
        <span>Cada encontro constrói pertencimento.</span>
        <span className="demo-label">Cenário demonstrativo · São Paulo</span>
      </div>
      {showPresence && <PresenceDialog point={selected} onClose={() => setShowPresence(false)} />}
    </div>
  );
}
function ArrowUpIcon() {
  return <ArrowRightIcon size={18} />;
}
