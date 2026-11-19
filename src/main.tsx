import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  createBrowserRouter,
  RouterProvider,
  Link,
  Navigate,
  useSearchParams,
} from 'react-router-dom';
import '@fontsource/manrope/latin-400.css';
import '@fontsource/manrope/latin-500.css';
import '@fontsource/manrope/latin-600.css';
import '@fontsource/manrope/latin-700.css';
import {
  AppRoot,
  HomePage,
  MapPage,
  CommunitiesPage,
  CommunityDetail,
  EventDetail,
  ChatPage,
  ProfilePage,
  SeasonPage,
  PremiumPage,
} from './App';
import './styles.css';
import { Directory, GuildMap, GuildProfile, GuildRoot } from './guilds/GuildPages';
import { GuildVisit } from './guilds/GuildVisit';
import { markSrc } from './lib/assets';

function Entry() {
  const [params] = useSearchParams();
  return <Navigate replace to={params.has('point') ? '/mapa?' + params.toString() : '/inicio'} />;
}

const routeError = (
  <div className="boot-screen">
    <img src={markSrc} alt="Mannerbund" />
    <h1>Este caminho precisa de uma nova tentativa.</h1>
    <p>Recarregue a página para abrir este lugar novamente.</p>
    <button className="button button-primary" onClick={() => window.location.reload()}>
      Recarregar
    </button>
  </div>
);

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

const router = createBrowserRouter(
  [
    { path: '/', element: <Entry /> },
    {
      path: '/guildas',
      element: <GuildRoot />,
      errorElement: routeError,
      children: [
        { index: true, element: <Directory /> },
        { path: 'mapa', element: <GuildMap /> },
        { path: 'perfil/:id?', element: <GuildProfile /> },
        { path: ':id', element: <GuildVisit /> },
      ],
    },
    {
      element: <AppRoot />,
      errorElement: routeError,
      children: [
        { path: '/inicio', element: <HomePage /> },
        { path: '/mapa', element: <MapPage /> },
        { path: '/comunidades', element: <CommunitiesPage /> },
        { path: '/comunidades/:id', element: <CommunityDetail /> },
        { path: '/eventos/:id', element: <EventDetail /> },
        { path: '/conversas', element: <ChatPage /> },
        { path: '/conversas/:id', element: <ChatPage /> },
        { path: '/feed', element: <Navigate replace to="/inicio" /> },
        { path: '/perfil', element: <ProfilePage /> },
        { path: '/perfil/:id', element: <ProfilePage /> },
        { path: '/temporada', element: <SeasonPage /> },
        { path: '/premium', element: <PremiumPage /> },
        {
          path: '*',
          element: (
            <div className="empty-state">
              <h1>Esse lugar ainda não existe.</h1>
              <p>Mas há muitos outros esperando por você.</p>
              <Link className="button button-primary" to="/mapa">
                Voltar ao mapa
              </Link>
            </div>
          ),
        },
      ],
    },
  ],
  { basename },
);
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
