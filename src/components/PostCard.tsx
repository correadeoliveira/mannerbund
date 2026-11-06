import { useState } from 'react';
import { ChatCircleIcon, HeartIcon, TrashIcon } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import type { Post } from '../domain/types';
import { canModerate, dateTime } from '../domain/rules';
import { app } from '../services/app';
import { act } from '../state/ui';
import { Avatar, Button, Confirm, IconButton, Media, Seal, useApp, useBusy } from './ui';

export function PostCard({ post }: { post: Post }) {
  const { data, userId } = useApp(),
    author = data.users.find((u) => u.id === post.userId)!;
  const community = data.communities.find((c) => c.id === post.communityId);
  const [comments, setComments] = useState(false),
    [text, setText] = useState(''),
    [remove, setRemove] = useState(false);
  const { busy, run } = useBusy();
  return (
    <article className="post-card">
      <div className="post-head">
        {community ? (
          <Link to={`/comunidades/${community.id}`} aria-label={`Ver comunidade ${community.name}`}>
            <Seal community={community} />
          </Link>
        ) : (
          <Avatar user={author} link />
        )}
        <div>
          <Link
            className="strong-link"
            to={community ? `/comunidades/${community.id}` : `/perfil/${author.id}`}
          >
            {community?.name ?? author.name}
          </Link>
          <span className="meta">
            {community && `por ${author.name.split(' ')[0]} · `}
            {dateTime(post.createdAt)}
          </span>
        </div>
        {(post.userId === userId || canModerate(data, userId, post.communityId)) && (
          <IconButton label="Excluir publicação" onClick={() => setRemove(true)}>
            <TrashIcon size={17} />
          </IconButton>
        )}
      </div>
      <p className="post-text">{post.text}</p>
      {post.image && (
        <Media
          className="post-image"
          src={post.image}
          alt={`Imagem da publicação de ${author.name}`}
          loading="lazy"
        />
      )}
      <div className="post-actions">
        <button
          className={post.likes.includes(userId) ? 'liked' : ''}
          onClick={() => void act(() => app.like(userId, post.id))}
          aria-label={`${post.likes.includes(userId) ? 'Descurtir' : 'Curtir'} publicação`}
          aria-pressed={post.likes.includes(userId)}
        >
          <HeartIcon size={21} weight={post.likes.includes(userId) ? 'fill' : 'regular'} />
          {post.likes.length}
        </button>
        <button
          onClick={() => setComments(!comments)}
          aria-label={`Ver comentários (${post.comments.length})`}
          aria-expanded={comments}
        >
          <ChatCircleIcon size={21} />
          {post.comments.length}
          <span>comentários</span>
        </button>
      </div>
      {comments && (
        <div className="comments">
          {post.comments.map((c) => {
            const u = data.users.find((u) => u.id === c.userId)!;
            return (
              <div className="comment" key={c.id}>
                <Avatar user={u} size={28} link />
                <div>
                  <Link className="strong-link" to={`/perfil/${u.id}`}>
                    {u.name}
                  </Link>
                  <p>{c.text}</p>
                </div>
              </div>
            );
          })}
          <form
            className="inline-form"
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                await app.comment(userId, post.id, text);
                setText('');
              });
            }}
          >
            <input
              aria-label="Seu comentário"
              placeholder="Faça parte da conversa…"
              required
              maxLength={1000}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <Button disabled={busy || !text.trim()} type="submit" variant="secondary">
              Comentar
            </Button>
          </form>
        </div>
      )}
      {remove && (
        <Confirm
          title="Excluir publicação?"
          description="A publicação e seus comentários serão removidos deste protótipo."
          action="Excluir publicação"
          onConfirm={() => app.deletePost(userId, post.id)}
          onClose={() => setRemove(false)}
        />
      )}
    </article>
  );
}
