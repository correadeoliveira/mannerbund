import { useEffect, useId, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  CaretRightIcon,
  ChatCircleDotsIcon,
  CompassIcon,
  CrownSimpleIcon,
  FlaskIcon,
  InfoIcon,
  MapTrifoldIcon,
  NewspaperIcon,
  TrophyIcon,
  UsersThreeIcon,
  XIcon,
} from '@phosphor-icons/react';
import { Avatar, IconButton, useApp } from './ui';
import { useUI } from '../state/ui';
import { markSrc } from '../lib/assets';

const secondaryRoutes = ['/feed', '/temporada', '/premium', '/eventos'];

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
    { pathname } = useLocation();
  return (
    <nav className="mobile-dock" aria-label="Navegação no celular">
      <NavLink
        to="/mapa"
        end
        className={({ isActive }) => `mobile-dock-item ${isActive ? 'active' : ''}`}
        aria-label="Mapa"
        title="Mapa"
      >
        {({ isActive }) => (
          <>
            <MapTrifoldIcon size={22} weight={isActive ? 'fill' : 'regular'} aria-hidden="true" />
            {isActive && <span className="mobile-dock-dot" aria-hidden="true" />}
          </>
        )}
      </NavLink>
      <NavLink
        to="/conversas"
        className={({ isActive }) => `mobile-dock-item ${isActive ? 'active' : ''}`}
        aria-label={unread ? `Conversas, ${unread} não lidas` : 'Conversas'}
        title="Conversas"
      >
        {({ isActive }) => (
          <>
            <ChatCircleDotsIcon
              size={22}
              weight={isActive ? 'fill' : 'regular'}
              aria-hidden="true"
            />
            {unread > 0 && (
              <span className="mobile-dock-badge" aria-hidden="true">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
            {isActive && <span className="mobile-dock-dot" aria-hidden="true" />}
          </>
        )}
      </NavLink>
      <button
        type="button"
        className={`mobile-dock-more ${moreOpen ? 'open' : ''}`}
        data-active={isSecondary(pathname) || undefined}
        aria-label="Mais opções"
        aria-haspopup="dialog"
        aria-expanded={moreOpen}
        title="Mais opções"
        onClick={onMore}
      >
        <img src={markSrc} alt="" />
      </button>
      <NavLink
        to="/comunidades"
        className={({ isActive }) => `mobile-dock-item ${isActive ? 'active' : ''}`}
        aria-label="Comunidades"
        title="Comunidades"
      >
        {({ isActive }) => (
          <>
            <UsersThreeIcon size={22} weight={isActive ? 'fill' : 'regular'} aria-hidden="true" />
            {isActive && <span className="mobile-dock-dot" aria-hidden="true" />}
          </>
        )}
      </NavLink>
      <NavLink
        to="/perfil"
        className={({ isActive }) => `mobile-dock-item dock-profile ${isActive ? 'active' : ''}`}
        aria-label="Seu perfil"
        title="Seu perfil"
      >
        {({ isActive }) => (
          <>
            <Avatar user={user} size={24} />
            {isActive && <span className="mobile-dock-dot" aria-hidden="true" />}
          </>
        )}
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
          <h2 id={titleId}>Mais</h2>
          <IconButton label="Fechar mais opções" onClick={onClose}>
            <XIcon size={20} />
          </IconButton>
        </div>
        <div className="mobile-menu-grid">
          <Link to="/feed" className="mobile-menu-item" onClick={onClose}>
            <NewspaperIcon size={24} aria-hidden="true" />
            <span>Feed</span>
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
