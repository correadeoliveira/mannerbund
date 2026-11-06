import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon, PencilSimpleIcon } from '@phosphor-icons/react';
import { Avatar, Button, Empty, PageHeading, Seal, useApp } from '../components/ui';
import { PostComposer } from '../components/PostComposer';
import { PostCard } from '../components/PostCard';
import { EventCard } from '../components/EventCard';

export default function FeedPage() {
  const { data, user, now } = useApp(),
    [compose, setCompose] = useState(false),
    posts = [...data.posts].sort((a, b) => b.createdAt - a.createdAt);
  return (
    <div className="content-page">
      <PageHeading
        title="Histórias de quem vive a cidade."
        description="Encontros, descobertas e tudo que merece ser compartilhado."
      >
        <Button onClick={() => setCompose(true)}>
          <PencilSimpleIcon size={18} />
          Compartilhar história
        </Button>
      </PageHeading>
      <div className="feed-layout">
        <section className="feed-main">
          <button className="composer-trigger" onClick={() => setCompose(true)}>
            <Avatar user={user} />
            <span>O que você viveu hoje, {user.name.split(' ')[0]}?</span>
            <PencilSimpleIcon size={21} />
          </button>
          <div className="feed-sort">
            <span>As últimas histórias</span>
            <span>Mais recentes primeiro</span>
          </div>
          {posts.length ? (
            posts.map((p) => <PostCard key={p.id} post={p} />)
          ) : (
            <Empty
              title="A primeira história pode ser sua"
              text="Compartilhe um encontro ou uma descoberta."
              action={<Button onClick={() => setCompose(true)}>Publicar história</Button>}
            />
          )}
        </section>
        <aside className="feed-side">
          <div className="side-block">
            <h3>Vá além do feed.</h3>
            <p>As melhores histórias começam quando a gente se encontra.</p>
            {data.events
              .filter((e) => e.end > now)
              .sort((a, b) => a.start - b.start)
              .slice(0, 2)
              .map((e) => (
                <EventCard key={e.id} event={e} compact />
              ))}
          </div>
          <div className="side-block">
            <h3>Novos encontros, novas histórias.</h3>
            {data.communities.slice(2, 5).map((c) => (
              <Link key={c.id} className="community-mini" to={`/comunidades/${c.id}`}>
                <Seal community={c} size={36} />
                <span>
                  <strong>{c.name}</strong>
                  <small>{c.category}</small>
                </span>
                <ArrowRightIcon size={17} />
              </Link>
            ))}
            <Link className="text-link" to="/comunidades">
              Descobrir comunidades
              <ArrowRightIcon size={16} />
            </Link>
          </div>
          <p className="page-footnote">
            Conteúdo demonstrativo. As histórias que você publicar ficam neste navegador.
          </p>
        </aside>
      </div>
      {compose && <PostComposer onClose={() => setCompose(false)} />}
    </div>
  );
}
