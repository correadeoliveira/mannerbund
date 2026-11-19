import { useEffect, useId, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  CaretRightIcon,
  ChatCircleDotsIcon,
  CompassIcon,
  CrownSimpleIcon,
  FlaskIcon,
  HouseIcon,
  InfoIcon,
  MapTrifoldIcon,
  SquaresFourIcon,
  TrophyIcon,
  UsersThreeIcon,
  XIcon,
} from '@phosphor-icons/react';
import { Avatar, IconButton, useApp } from './ui';
import { useUI } from '../state/ui';

const secondaryRoutes = ['/mapa', '/comunidades', '/temporada', '/premium', '/eventos', '/guildas'];

function isSecondary(pathname: string) {
  return secondaryRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function MobileDock({
  unread,
  moreOpen,
  onMore,
}: {
  unread: number;
  moreOpen: boolean;
  onMore: () => void;
}) {
  const { user } = useApp(),
    { pathname, search } = useLocation();
  const homeTab =
    pathname === '/inicio' && new URLSearchParams(search).get('aba') === 'outras'
      ? 'outras'
      : 'minha';

  return (
    <nav className="mobile-dock" aria-label="Navegação no celular">
      <Link
        to="/inicio"
        className={`mobile-dock-item ${pathname === '/inicio' && homeTab === 'minha' ? 'active' : ''}`}
        aria-label="Início"
        title="Início"
      >
        <HouseIcon
          size={21}
          weight={pathname === '/inicio' && homeTab === 'minha' ? 'fill' : 'regular'}
          aria-hidden="true"
        />
        <span className="mobile-dock-label">Início</span>
      </Link>
      <Link
        to="/inicio?aba=outras"
        className={`mobile-dock-item ${pathname === '/inicio' && homeTab === 'outras' ? 'active' : ''}`}
        aria-label="Outras comunidades"
        title="Outras comunidades"
      >
        <UsersThreeIcon
          size={21}
          weight={pathname === '/inicio' && homeTab === 'outras' ? 'fill' : 'regular'}
          aria-hidden="true"
        />
        <span className="mobile-dock-label">Outras</span>
      </Link>
      <button
        type="button"
        className={`mobile-dock-more ${moreOpen ? 'open' : ''}`}
        data-active={isSecondary(pathname) || undefined}
        aria-label="Abrir todas as funções"
        aria-haspopup="dialog"
        aria-expanded={moreOpen}
        title="Mais funções"
        onClick={onMore}
      >
        <SquaresFourIcon size={22} weight={moreOpen ? 'fill' : 'regular'} aria-hidden="true" />
        <span className="mobile-dock-more-label">Mais</span>
      </button>
      <NavLink
        to="/conversas"
        className={({ isActive }) => `mobile-dock-item ${isActive ? 'active' : ''}`}
        aria-label={unread ? `Conversas, ${unread} não lidas` : 'Conversas'}
        title="Conversas"
      >
        {({ isActive }) => (
          <>
            <ChatCircleDotsIcon
              size={21}
              weight={isActive ? 'fill' : 'regular'}
              aria-hidden="true"
            />
            {unread > 0 && (
              <span className="mobile-dock-badge" aria-hidden="true">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
            <span className="mobile-dock-label">Conversas</span>
          </>
        )}
      </NavLink>
      <NavLink
        to="/perfil"
        className={({ isActive }) => `mobile-dock-item dock-profile ${isActive ? 'active' : ''}`}
        aria-label="Seu perfil"
        title="Seu perfil"
      >
        <Avatar user={user} size={22} />
        <span className="mobile-dock-label">Perfil</span>
      </NavLink>
    </nav>
  );
}

export function MobileMenu({
  onClose,
  onHelp,
  onPersona,
}: {
  onClose: () => void;
  onHelp: () => void;
  onPersona: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    titleId = useId(),
    { user } = useApp(),
    demoOpen = useUI((state) => state.demoOpen),
    toggleDemo = useUI((state) => state.toggleDemo);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (!element.open) element.showModal();
    return () => {
      if (element.open) element.close();
    };
  }, []);
  return (
    <dialog
      id="mobile-more-menu"
      ref={dialog}
      className="mobile-menu"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="mobile-menu-panel">
        <span className="mobile-menu-grab" aria-hidden="true" />
        <div className="mobile-menu-head">
          <div>
            <h2 id={titleId}>Mais</h2>
            <p>Mapa, comunidades e o resto do seu mundo.</p>
          </div>
          <IconButton label="Fechar mais opções" onClick={onClose}>
            <XIcon size={20} />
          </IconButton>
        </div>
        <div className="mobile-menu-grid">
          <Link to="/mapa" className="mobile-menu-item" onClick={onClose}>
            <MapTrifoldIcon size={24} aria-hidden="true" />
            <span>Mapa</span>
          </Link>
          <Link to="/comunidades" className="mobile-menu-item" onClick={onClose}>
            <CompassIcon size={24} aria-hidden="true" />
            <span>Comunidades</span>
          </Link>
          <Link to="/temporada" className="mobile-menu-item" onClick={onClose}>
            <TrophyIcon size={24} aria-hidden="true" />
            <span>Temporada</span>
          </Link>
          <Link to="/premium" className="mobile-menu-item" onClick={onClose}>
            <CrownSimpleIcon size={24} aria-hidden="true" />
            <span>Premium</span>
          </Link>
          <Link to="/guildas" className="mobile-menu-item" onClick={onClose}>
            <CompassIcon size={24} aria-hidden="true" />
            <span>Guildas</span>
          </Link>
          <Link to="/conversas" className="mobile-menu-item" onClick={onClose}>
            <ChatCircleDotsIcon size={24} aria-hidden="true" />
            <span>Conversas</span>
          </Link>
          <button
            type="button"
            className="mobile-menu-item"
            onClick={() => {
              onClose();
              onHelp();
            }}
          >
            <InfoIcon size={24} aria-hidden="true" />
            <span>Como funciona</span>
          </button>
          <button
            type="button"
            className={`mobile-menu-item ${demoOpen ? 'active' : ''}`}
            aria-pressed={demoOpen}
            onClick={() => {
              toggleDemo();
              onClose();
            }}
          >
            <FlaskIcon size={24} aria-hidden="true" />
            <span>Demonstração</span>
          </button>
        </div>
        <button
          type="button"
          className="mobile-menu-profile"
          aria-label={`Trocar perfil. Atual: ${user.name}`}
          onClick={() => {
            onClose();
            onPersona();
          }}
        >
          <Avatar user={user} size={38} />
          <span>
            <strong>{user.name}</strong>
            <small>Trocar perfil</small>
          </span>
          <CaretRightIcon size={18} aria-hidden="true" />
        </button>
      </div>
    </dialog>
  );
}
