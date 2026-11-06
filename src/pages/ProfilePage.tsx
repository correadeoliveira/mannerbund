import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowRightIcon,
  ChatCircleDotsIcon,
  CheckIcon,
  MapPinIcon,
  PencilSimpleIcon,
  TrophyIcon,
} from '@phosphor-icons/react';
import { dateTime, formatHours, participants, seasonKey } from '../domain/rules';
import { app } from '../services/app';
import { act } from '../state/ui';
import {
  Avatar,
  Button,
  Empty,
  ImageUpload,
  Media,
  Modal,
  Seal,
  useApp,
  useBusy,
} from '../components/ui';
import { PostCard } from '../components/PostCard';
import type { Badge } from '../domain/types';

export default function ProfilePage() {
  const { id } = useParams(),
    { data, userId, now } = useApp(),
    [params, setParams] = useSearchParams(),
    navigate = useNavigate();
  const [edit, setEdit] = useState(false),
    [people, setPeople] = useState<'followers' | 'following'>(),
    [badge, setBadge] = useState<Badge>();
  const profile = data.users.find((u) => u.id === (id ?? userId));
  if (!profile)
    return (
      <Empty
        title="Perfil não encontrado"
        text="Essa pessoa não está no cenário local."
        action={<Link to="/feed">Voltar ao feed</Link>}
      />
    );
  const own = profile.id === userId,
    following = data.follows.some((f) => f.from === userId && f.to === profile.id),
    followers = data.follows.filter((f) => f.to === profile.id),
    follows = data.follows.filter((f) => f.from === profile.id),
    posts = data.posts
      .filter((p) => p.userId === profile.id)
      .sort((a, b) => b.createdAt - a.createdAt),
    badges = data.badges.filter((b) => b.userId === profile.id).sort((a, b) => b.date - a.date),
    tab = params.get('tab') === 'trofeus' ? 'trofeus' : 'historias',
    communities = data.communities.filter((c) =>
      data.memberships.some((m) => m.userId === profile.id && m.communityId === c.id),
    );
  const duration = data.communities.reduce(
    (s, c) =>
      s +
      (participants(data, c.id, seasonKey(now)).find((p) => p.userId === profile.id)?.duration ??
        0),
    0,
  );
  return (
    <div className="content-page profile-page">
      <div className="profile-banner">
        <div className="profile-banner-art">
          <img src="/mark.svg" alt="" />
        </div>
        <span>
          Os lugares guardam histórias.
          <br />
          As pessoas também.
        </span>
      </div>
      <div className="profile-header">
        <Avatar user={profile} size={100} />
        <div className="profile-main-info">
          <h1>
            {profile.name}
            {profile.premium && <span className="premium-badge">Premium</span>}
          </h1>
          <span className="muted">@{profile.handle}</span>
        </div>
        <div className="profile-actions">
          {own ? (
            <Button variant="secondary" onClick={() => setEdit(true)}>
              <PencilSimpleIcon size={17} />
              Editar perfil
            </Button>
          ) : (
            <>
              <Button
                variant={following ? 'secondary' : 'primary'}
                onClick={() => void act(() => app.follow(userId, profile.id))}
              >
                {following ? (
                  <>
                    <CheckIcon size={17} />
                    Seguindo
                  </>
                ) : (
                  'Seguir'
                )}
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  void act(async () => {
                    const id = await app.dm(userId, profile.id);
                    navigate(`/conversas/${id}`);
                  })
                }
              >
                <ChatCircleDotsIcon size={18} />
                Conversar
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="profile-bio">
        {own && (
          <Link to="/premium" className="profile-premium-link">
            {profile.premium ? 'Seu Premium demonstrativo' : 'Conheça o Premium'}
            <ArrowRightIcon size={13} />
          </Link>
        )}
        <p>{profile.bio || 'Esta história está começando.'}</p>
        <span className="meta">
          <MapPinIcon size={15} />
          São Paulo, Brasil
        </span>
        <div className="profile-numbers">
          <span>
            <strong>{posts.length}</strong> histórias
          </span>
          <button onClick={() => setPeople('followers')}>
            <strong>{followers.length}</strong> seguidores
          </button>
          <button onClick={() => setPeople('following')}>
            <strong>{follows.length}</strong> seguindo
          </button>
        </div>
      </div>
      <div className="profile-content">
        <section>
          <div className="tabs" role="tablist" aria-label="Conteúdo do perfil">
            <button role="tab" aria-selected={tab === 'historias'} onClick={() => setParams({})}>
              Histórias <span>{posts.length}</span>
            </button>
            <button
              role="tab"
              aria-selected={tab === 'trofeus'}
              onClick={() => setParams({ tab: 'trofeus' })}
            >
              <TrophyIcon size={17} />
              Troféus <span>{badges.length}</span>
            </button>
          </div>
          {tab === 'historias' ? (
            posts.length ? (
              posts.map((p) => <PostCard key={p.id} post={p} />)
            ) : (
              <Empty
                title="Toda história tem seu tempo"
                text="As publicações desta pessoa vão aparecer aqui."
              />
            )
          ) : (
            <>
              <p className="trophy-intro">Encontros que passam. Conquistas que ficam.</p>
              {badges.length ? (
                <div className="trophy-grid">
                  {badges.map((b) => (
                    <button className="trophy-card" key={b.id} onClick={() => setBadge(b)}>
                      <Media src={b.image} alt={`Medalhão ${b.title}`} />
                      <div>
                        <span className="meta">{b.communityName}</span>
                        <h3>{b.title}</h3>
                        <span className="meta">
                          {new Intl.DateTimeFormat('pt-BR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            timeZone: 'America/Sao_Paulo',
                          }).format(b.date)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <Empty
                  title="Sua próxima conquista espera por você"
                  text="Participe de um encontro, confirme o convite e registre sua presença para ganhar uma insígnia exclusiva."
                  action={
                    own && (
                      <Link className="button button-secondary" to="/comunidades">
                        Encontrar um encontro
                      </Link>
                    )
                  }
                />
              )}
            </>
          )}
        </section>
        <aside>
          <div className="side-block">
            <h3>Presença neste mês</h3>
            <div className="large-data">{formatHours(duration)}</div>
            <p>de tempo compartilhado com as comunidades.</p>
          </div>
          <div className="side-block">
            <h3>Parte destas histórias</h3>
            {communities.map((c) => (
              <Link className="community-mini" to={`/comunidades/${c.id}`} key={c.id}>
                <Seal community={c} size={36} />
                <span>
                  <strong>{c.name}</strong>
                  <small>{c.ownerId === profile.id ? 'Criador da comunidade' : c.category}</small>
                </span>
                <ArrowRightIcon size={16} />
              </Link>
            ))}
            {!communities.length && <p>A primeira comunidade ainda está por vir.</p>}
          </div>
        </aside>
      </div>
      {edit && <EditProfile onClose={() => setEdit(false)} />}{' '}
      {people && (
        <Modal
          title={
            people === 'followers' ? 'Quem acompanha esta história' : 'Histórias que acompanha'
          }
          onClose={() => setPeople(undefined)}
        >
          {(people === 'followers' ? followers.map((f) => f.from) : follows.map((f) => f.to)).map(
            (id) => {
              const u = data.users.find((u) => u.id === id)!;
              return (
                <Link
                  className="person-row"
                  to={`/perfil/${id}`}
                  key={id}
                  onClick={() => setPeople(undefined)}
                >
                  <Avatar user={u} />
                  <span className="person-name">
                    <strong>{u.name}</strong>
                    <small>@{u.handle}</small>
                  </span>
                  <ArrowRightIcon size={18} />
                </Link>
              );
            },
          )}
          {(people === 'followers' ? followers : follows).length === 0 && (
            <Empty title="Uma história por descobrir" text="As conexões vão aparecer aqui." />
          )}
        </Modal>
      )}{' '}
      {badge && (
        <Modal title="Uma memória conquistada" onClose={() => setBadge(undefined)}>
          <div className="badge-detail">
            <Media src={badge.image} alt={badge.title} />
            <h2>{badge.title}</h2>
            <p>{badge.description}</p>
            <span className="meta">
              {badge.communityName} · {dateTime(badge.date)}
            </span>
            <Link
              className="text-link"
              to={`/eventos/${badge.eventId}`}
              onClick={() => setBadge(undefined)}
            >
              Revisitar o encontro
              <ArrowRightIcon size={17} />
            </Link>
          </div>
        </Modal>
      )}
    </div>
  );
}
function EditProfile({ onClose }: { onClose: () => void }) {
  const { user, userId } = useApp(),
    { busy, run } = useBusy(),
    [name, setName] = useState(user.name),
    [bio, setBio] = useState(user.bio),
    [avatar, setAvatar] = useState(user.avatar);
  return (
    <Modal title="Seu jeito de se apresentar" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run(async () => {
            await app.editProfile(userId, { name, bio, avatar });
            onClose();
          }, 'Seu perfil foi atualizado.');
        }}
      >
        <ImageUpload value={avatar} onChange={setAvatar} label="Escolher foto de perfil" />
        <label>
          Como quer ser chamado?
          <input value={name} required maxLength={60} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          Um pouco sobre você
          <textarea rows={3} maxLength={300} value={bio} onChange={(e) => setBio(e.target.value)} />
        </label>
        <div className="form-actions">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={busy} type="submit">
            Salvar perfil
          </Button>
        </div>
      </form>
    </Modal>
  );
}
