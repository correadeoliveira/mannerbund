import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  CompassIcon,
  MapPinIcon,
  MapTrifoldIcon,
  UserCircleIcon,
  FlagBannerIcon,
} from '@phosphor-icons/react';
import { Button, Empty, Modal, Seal, Toast, useBusy } from '../components/ui';
import { ProfileCharacter } from '../components/Character';
import { ProfileVisits } from '../components/ProfileVisits';
import { communityScores, dateTime, MINUTE, seasonKey, territoryOwner } from '../domain/rules';
import { GuildAvatar, GuildMedal } from './Identity';
import { guilds, visitorId } from './scripts';
import { guestGuild, worldTime } from './world';
import { GuildProvider } from './runtime';
import { useGuild } from './context';
import './guilds.css';

const MapCanvas = lazy(() => import('../components/MapCanvas'));

function Layout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <div className="guild-app">
      <a href="#guild-main" className="skip-link">
        Ir para o conteúdo
      </a>
      <header className="guild-bar">
        <div>
          <Link to="/guildas" className="guild-brand">
            <img src="/mark.svg" alt="" />
            Mannerbund
          </Link>
          <nav aria-label="Visita às guildas">
            <NavLink to="/guildas" end>
              <CompassIcon />
              Guildas
            </NavLink>
            <NavLink to="/guildas/mapa">
              <MapTrifoldIcon />
              Mapa
            </NavLink>
            <NavLink to="/guildas/perfil">
              <UserCircleIcon />
              Meu perfil
            </NavLink>
          </nav>
        </div>
      </header>
      <main id="guild-main" className="guild-content">
        <Outlet />
      </main>
      <footer className="guild-footer">
        <span>Experiência local com personagens simulados.</span>
        <Link to="/mapa">
          Explorar o protótipo original <ArrowUpRightIcon />
        </Link>
      </footer>
      <Toast />
    </div>
  );
}
export function GuildRoot() {
  return (
    <GuildProvider>
      <Layout />
    </GuildProvider>
  );
}

export function Directory() {
  const { world } = useGuild();
  const current = guestGuild(world);
  const featured = current ?? guilds[0].communityId;
  const ordered = [
    guilds.find((g) => g.communityId === featured)!,
    ...guilds.filter((g) => g.communityId !== featured),
  ];
  return (
    <>
      <header className="guild-title">
        <p className="guild-locator">
          <MapPinIcon weight="fill" /> São Paulo, SP
        </p>
        <h1>Escolha uma comunidade para visitar</h1>
        <p>
          Conheça o grupo, confirme um encontro e conquiste um lugar na cidade. Os membros desta
          visita são personagens simulados.
        </p>
      </header>
      <div className="guild-atlas">
        {ordered.map((script, index) => {
          const c = world.communities.find((c) => c.id === script.communityId)!;
          const host = world.users.find((u) => u.id === c.ownerId)!;
          const post = world.posts.filter((p) => p.communityId === c.id).at(-1)!;
          const point = world.points.find((p) => p.id === script.pointId)!;
          const finished = world.visits[c.id]?.stage === 'finished';
          return (
            <Link
              className={index === 0 ? 'guild-feature' : 'guild-listing'}
              key={c.id}
              to={'/guildas/' + c.id}
            >
              <div className="guild-cover">
                <img src={c.cover} alt="" loading={index === 0 ? 'eager' : 'lazy'} />
                <Seal community={c} size={index === 0 ? 54 : 30} />
              </div>
              <div className="guild-entry">
                <span className="guild-kicker">
                  {current === c.id ? 'Sua comunidade' : c.category}
                </span>
                <h2>{c.name}</h2>
                <p className="guild-entry-event">
                  {script.title} · {point.name}
                </p>
                <p className="guild-excerpt">
                  “{post.text}” <span>— {host.name.split(' ')[0]}</span>
                </p>
                {index === 0 && (
                  <span className="guild-visit-link">
                    {finished
                      ? 'Rever encontro'
                      : current
                        ? 'Continuar visita'
                        : 'Visitar comunidade'}{' '}
                    <ArrowRightIcon />
                  </span>
                )}
              </div>
              {index > 0 && <ArrowUpRightIcon className="guild-open" aria-hidden="true" />}
            </Link>
          );
        })}
      </div>
    </>
  );
}
export function GuildMap() {
  const { world } = useGuild();
  const [params, setParams] = useSearchParams();
  const selected = world.points.find((p) => p.id === params.get('point')) ?? world.points[0];
  const season = seasonKey(worldTime(world));
  const owners = Object.fromEntries(
    world.points.map((p) => [
      p.id,
      world.communities.find((c) => c.id === territoryOwner(world, p.id, season)),
    ]),
  );
  const scores = communityScores(world, selected.id, season);
  const visit = guilds.find((g) => g.pointId === selected.id)!;
  return (
    <>
      <header className="guild-title">
        <p className="guild-locator">
          <MapPinIcon />
          São Paulo, SP
        </p>
        <h1>Territórios das guildas</h1>
        <p>O tempo de quem participa define qual estandarte aparece no mapa.</p>
      </header>
      <div className="guild-map-grid">
        <div className="guild-map">
          <Suspense fallback={<p>Carregando mapa…</p>}>
            <MapCanvas
              points={world.points}
              owners={owners}
              selected={selected.id}
              focusSelected={params.has('point')}
              onSelect={(id) => setParams({ point: id })}
            />
          </Suspense>
        </div>
        <section className="guild-panel">
          <label>
            Escolher território
            <select value={selected.id} onChange={(e) => setParams({ point: e.target.value })}>
              {world.points.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <h2>{selected.name}</h2>
          <p>
            {selected.neighborhood} · raio de {selected.radius} m
          </p>
          {owners[selected.id] && (
            <div className="guild-winner">
              <Seal community={owners[selected.id]!} />
              <strong>Domínio de {owners[selected.id]!.name}</strong>
            </div>
          )}
          {scores.map((s) => (
            <p key={s.communityId}>
              {world.communities.find((c) => c.id === s.communityId)?.name} · {s.duration / MINUTE}{' '}
              min
            </p>
          ))}
          <Link className="text-link" to={'/guildas/' + visit.communityId}>
            Visitar a guilda do encontro <ArrowRightIcon />
          </Link>
        </section>
      </div>
    </>
  );
}

export function GuildProfile() {
  const { world, actions } = useGuild();
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const user = world.users.find((u) => u.id === (id ?? visitorId));
  const [rename, setRename] = useState(false),
    [draft, setDraft] = useState('');
  const { busy, run } = useBusy();
  if (!user)
    return (
      <Empty
        title="Perfil não encontrado"
        text="Escolha um membro na página da guilda."
        action={<Link to="/guildas">Ver guildas</Link>}
      />
    );
  const own = user.id === visitorId,
    tab = params.get('tab') ?? 'trofeus';
  const badges = world.badges.filter((b) => b.userId === user.id).sort((a, b) => b.date - a.date);
  const communities = world.communities.filter((c) =>
    world.memberships.some((m) => m.communityId === c.id && m.userId === user.id),
  );
  return (
    <div className="guild-profile">
      <header className="guild-title">
        <p className="guild-locator">
          <UserCircleIcon />
          {own ? 'Seu perfil de visitante' : 'Personagem simulado'}
        </p>
        <div className="guild-profile-name">
          {!own && <GuildAvatar user={user} size={56} />}
          <h1>{user.name}</h1>
        </div>
        <p>{user.bio}</p>
        {own && (
          <Button
            variant="secondary"
            onClick={() => {
              setDraft(user.name);
              setRename(true);
            }}
          >
            Editar nome
          </Button>
        )}
        {communities.map((c) => (
          <Link className="text-link" key={c.id} to={'/guildas/' + c.id}>
            <FlagBannerIcon />
            {c.name}
          </Link>
        ))}
      </header>
      <ProfileCharacter profile={user} own={own} save={actions.dress} />
      <div className="tabs" aria-label="Conteúdo do perfil">
        <button aria-pressed={tab !== 'lugares'} onClick={() => setParams({ tab: 'trofeus' })}>
          Troféus · {badges.length}
        </button>
        {own && (
          <button aria-pressed={tab === 'lugares'} onClick={() => setParams({ tab: 'lugares' })}>
            Lugares visitados
          </button>
        )}
      </div>
      {own && tab === 'lugares' ? (
        <ProfileVisits simulated />
      ) : badges.length ? (
        <ul className="guild-trophies">
          {badges.map((b) => (
            <li key={b.id}>
              <GuildMedal
                badge={b}
                community={world.communities.find((c) => c.id === b.communityId)!}
              />
              <div>
                <h2>{b.title}</h2>
                <p>{b.description}</p>
                <p className="meta">
                  {b.communityName} · {b.eventTitle} · {dateTime(b.date)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Empty
          title="O primeiro troféu espera um encontro"
          text="Participar por 30 minutos rende a insígnia da guilda."
          action={<Link to="/guildas">Ver comunidades</Link>}
        />
      )}
      {rename && (
        <Modal title="Editar nome" onClose={() => setRename(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                await actions.rename(draft);
                setRename(false);
              });
            }}
          >
            <label>
              Como você quer aparecer?
              <input
                autoFocus
                required
                maxLength={60}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
            </label>
            <div className="form-actions">
              <Button disabled={busy}>Salvar nome</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
