import { DataContext } from './state/context';
import { lazy, Suspense, useEffect, useState } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import {
  BellIcon,
  CaretDownIcon,
  ChatCircleDotsIcon,
  CompassIcon,
  CrownSimpleIcon,
  FlaskIcon,
  InfoIcon,
  MapPinIcon,
  MapTrifoldIcon,
  NewspaperIcon,
  TrophyIcon,
  UserCircleIcon,
  UsersThreeIcon,
} from '@phosphor-icons/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, initialize } from './data/database';
import { app } from './services/app';
import { isMember } from './domain/rules';
import { useUI, act } from './state/ui';
import { Avatar, Button, Empty, IconButton, Modal, Seal, Toast, useApp } from './components/ui';
import { DemoPanel, PersonaPicker, PresenceMonitor } from './components/DemoPanel';
import { EventCard } from './components/EventCard';
import { ConquestMoment } from './components/ConquestMoment';

export function AppRoot() {
  const [error, setError] = useState(''),
    [ready, setReady] = useState(false),
    [retry, setRetry] = useState(0),
    data = useLiveQuery(() => db.state.get('app').catch(() => null), [], null);
  useEffect(() => {
    let active = true;
    setError('');
    void initialize()
      .then(() => {
        if (active) setReady(true);
      })
      .catch(() => {
        if (active)
          setError(
            'O armazenamento local não está disponível. Permita dados de sites neste navegador ou abra em uma janela normal e tente novamente.',
          );
      });
    return () => {
      active = false;
    };
  }, [retry]);
  useEffect(() => {
    if (!ready) return;
    void act(() => app.settle());
    const timer = setInterval(() => void act(() => app.settle()), 30000);
    return () => clearInterval(timer);
  }, [ready]);
  if (error)
    return (
      <div className="boot-screen">
        <img src="/mark.svg" alt="Mannerbund" />
        <h1>Precisamos de um lugar para guardar suas histórias.</h1>
        <p>{error}</p>
        <Button onClick={() => setRetry((r) => r + 1)}>Tentar novamente</Button>
      </div>
    );
  if (!ready || !data)
    return (
      <div className="boot-screen">
        <img src="/mark.svg" alt="Mannerbund" />
        <span className="spinner" />
        <p>Preparando um lugar para você…</p>
      </div>
    );
  return (
    <DataContext.Provider value={data}>
      <Shell />
    </DataContext.Provider>
  );
}
function Shell() {
  const { data, user, userId, now } = useApp(),
    location = useLocation(),
    toggleDemo = useUI((s) => s.toggleDemo),
    demoOpen = useUI((s) => s.demoOpen),
    [persona, setPersona] = useState(false),
    [help, setHelp] = useState(false),
    [invites, setInvites] = useState(false);
  const communities = data.communities.filter((c) => isMember(data, userId, c.id)),
    pending = data.events.filter(
      (e) =>
        e.invitedIds.includes(userId) &&
        !e.acceptedIds.includes(userId) &&
        e.end > now &&
        isMember(data, userId, e.communityId),
    );
  useEffect(() => {
    window.scrollTo({ top: 0 });
    const main = document.getElementById('main-content');
    if (main) main.scrollTop = 0;
  }, [location.pathname]);
  const nav = [
    { to: '/', label: 'Mapa', Icon: MapTrifoldIcon },
    { to: '/comunidades', label: 'Por perto', Icon: CompassIcon },
    { to: '/conversas', label: 'Conversas', Icon: ChatCircleDotsIcon },
    { to: '/feed', label: 'Feed', Icon: NewspaperIcon },
    { to: '/perfil', label: 'Perfil', Icon: UserCircleIcon },
  ];
  const unread = data.conversations
    .filter((c) =>
      c.kind === 'dm'
        ? c.participantIds.includes(userId)
        : communities.some((x) => x.id === c.communityId),
    )
    .reduce(
      (s, c) =>
        s +
        data.messages.filter(
          (m) =>
            m.conversationId === c.id &&
            m.userId !== userId &&
            m.createdAt > (data.reads[`${userId}:${c.id}`] ?? 0),
        ).length,
      0,
    );
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Ir para o conteúdo
      </a>
      <aside className="sidebar">
        <Link to="/" className="brand">
          <img src="/mark.svg" alt="" />
          <span>
            Mannerbund<span>Seu lugar é com gente.</span>
          </span>
        </Link>
        <nav className="main-navigation" aria-label="Navegação principal">
          {nav.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/' || to === '/perfil'}
              className={({ isActive }) =>
                isActive || (to === '/perfil' && location.pathname.startsWith('/perfil/'))
                  ? 'nav-item active'
                  : 'nav-item'
              }
            >
              <Icon size={21} weight={location.pathname === to ? 'fill' : 'regular'} />
              <span>{label}</span>
              {to === '/conversas' && unread > 0 && <span className="nav-count">{unread}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-communities">
          <div className="sidebar-section-title">
            <span>Suas comunidades</span>
            <Link to="/comunidades" aria-label="Descobrir comunidades">
              <UsersThreeIcon size={16} />
            </Link>
          </div>
          {communities.slice(0, 4).map((c) => (
            <Link className="sidebar-community" to={`/comunidades/${c.id}`} key={c.id}>
              <Seal community={c} size={30} />
              <span>{c.name}</span>
            </Link>
          ))}
          {!communities.length && (
            <Link className="text-link" to="/comunidades">
              Encontre sua primeira comunidade
            </Link>
          )}
        </div>
        <div className="sidebar-bottom">
          <NavLink
            to="/temporada"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <TrophyIcon size={20} />
            <span>A temporada</span>
          </NavLink>
          <NavLink
            to="/premium"
            className={({ isActive }) => `nav-item premium-nav ${isActive ? 'active' : ''}`}
          >
            <CrownSimpleIcon size={20} />
            <span>Explore o Premium</span>
          </NavLink>
          <button className={`demo-toggle ${demoOpen ? 'selected' : ''}`} onClick={toggleDemo}>
            <FlaskIcon size={18} />
            <span>Demonstração</span>
            <span className="local-pill">Local</span>
          </button>
          <button
            className="sidebar-user"
            onClick={() => setPersona(true)}
            aria-label={`Trocar perfil. Atual: ${user.name}`}
          >
            <Avatar user={user} size={36} />
            <span>
              <strong>
                {user.name.split(' ')[0]} {user.name.split(' ').at(-1)}
              </strong>
              <small>{user.premium ? 'Premium demonstrativo' : 'Conta demonstrativa'}</small>
            </span>
            <CaretDownIcon size={15} />
          </button>
        </div>
        <span className="sidebar-version">Feito de encontros. Desde agora.</span>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <Link to="/" className="mobile-brand">
            <img src="/mark.svg" alt="Mannerbund" />
            <span>Mannerbund</span>
          </Link>
          <div className="topbar-location">
            <MapPinIcon size={17} />
            <span>São Paulo, SP</span>
            <span className="topbar-separator" />
            Seu mundo, mais perto.
          </div>
          <div className="topbar-actions">
            <button className="help-button" onClick={() => setHelp(true)}>
              <InfoIcon size={17} />
              <span>Como funciona</span>
            </button>
            <IconButton
              label={`Seus convites${pending.length ? `: ${pending.length} pendentes` : ''}`}
              onClick={() => setInvites(true)}
            >
              <BellIcon size={21} />
              {pending.length > 0 && <span className="notification-dot" />}
            </IconButton>
            <button
              className="mobile-demo-button icon-button"
              aria-label="Abrir demonstração"
              onClick={toggleDemo}
            >
              <FlaskIcon size={21} />
            </button>
            <button
              className="topbar-profile"
              onClick={() => setPersona(true)}
              aria-label="Trocar perfil demonstrativo"
            >
              <Avatar user={user} size={32} />
            </button>
          </div>
        </header>
        <PresenceMonitor />
        <main
          id="main-content"
          className={
            location.pathname === '/'
              ? 'main-content map-main'
              : location.pathname.startsWith('/conversas')
                ? 'main-content chat-main'
                : 'main-content'
          }
        >
          <Suspense
            fallback={
              <div className="route-loading">
                <span className="spinner" />
                Preparando este lugar…
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
        <nav className="mobile-navigation" aria-label="Navegação no celular">
          {nav.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} end={to === '/'}>
              <Icon size={22} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
      <DemoPanel />
      <Toast />
      <ConquestMoment />
      {persona && <PersonaPicker onClose={() => setPersona(false)} />}{' '}
      {help && (
        <Modal title="Um lugar é feito de quem está nele." onClose={() => setHelp(false)}>
          <div className="how-it-works">
            <MapTrifoldIcon size={40} weight="thin" />
            <p>
              Encontre comunidades, confirme encontros e registre o tempo que vocês passam juntos
              nos lugares da cidade.
            </p>
            <h3>O tempo de cada pessoa se soma.</h3>
            <p>
              Cinco pessoas por uma hora representam cinco horas coletivas. Se outra comunidade
              superar esse total no mesmo point, ela conquista o território. Empates mantêm o
              domínio atual.
            </p>
            <h3>Todo mês, uma nova história.</h3>
            <p>
              Os territórios recomeçam livres em cada temporada. As conquistas anteriores e os
              troféus dos eventos ficam no histórico.
            </p>
            <h3>Explore sem sair do PC.</h3>
            <p>
              Abra a demonstração para trocar de perfil, avançar o tempo e simular a presença dentro
              ou fora do raio. Não há cobrança ou pagamentos reais.
            </p>
            <Button
              onClick={() => {
                setHelp(false);
                if (!demoOpen) toggleDemo();
              }}
            >
              <FlaskIcon size={18} />
              Abrir demonstração
            </Button>
          </div>
        </Modal>
      )}{' '}
      {invites && (
        <Modal title="Seu próximo encontro espera por você" onClose={() => setInvites(false)}>
          {pending.length ? (
            pending.map((e) => (
              <div key={e.id} onClick={() => setInvites(false)}>
                <EventCard event={e} />
              </div>
            ))
          ) : (
            <Empty
              title="Seus convites estão em dia"
              text="Novos convites de encontros vão aparecer aqui."
              action={
                <Link to="/comunidades" onClick={() => setInvites(false)}>
                  Descobrir comunidades
                </Link>
              }
            />
          )}
        </Modal>
      )}
    </div>
  );
}
export const MapPage = lazy(() => import('./pages/MapPage'));
export const CommunitiesPage = lazy(() => import('./pages/CommunitiesPage'));
export const CommunityDetail = lazy(() => import('./pages/CommunityDetail'));
export const EventDetail = lazy(() => import('./pages/EventDetail'));
export const ChatPage = lazy(() => import('./pages/ChatPage'));
export const FeedPage = lazy(() => import('./pages/FeedPage'));
export const ProfilePage = lazy(() => import('./pages/ProfilePage'));
export const SeasonPage = lazy(() => import('./pages/SeasonPage'));
export const PremiumPage = lazy(() => import('./pages/PremiumPage'));
