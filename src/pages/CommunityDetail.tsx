import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRightIcon,
  CalendarBlankIcon,
  ChatCircleDotsIcon,
  CheckIcon,
  GearSixIcon,
  MapPinIcon,
  PaintBrushIcon,
  PlusIcon,
  SignOutIcon,
  TrashIcon,
  UsersThreeIcon,
} from '@phosphor-icons/react';
import {
  communityTotal,
  formatHours,
  isMember,
  membershipError,
  seasonKey,
  territoryOwner,
} from '../domain/rules';
import { app } from '../services/app';
import { act } from '../state/ui';
import {
  Avatar,
  Button,
  Confirm,
  Empty,
  IconButton,
  Media,
  Modal,
  Seal,
  useApp,
  useBusy,
} from '../components/ui';
import { CommunityForm } from '../components/CommunityForm';
import { EventForm } from '../components/EventForm';
import { EventCard } from '../components/EventCard';
import { PostComposer } from '../components/PostComposer';
import { PostCard } from '../components/PostCard';
import { accessibleAccent } from '../lib/colors';

export default function CommunityDetail() {
  const { id } = useParams(),
    { data, userId, user, now } = useApp(),
    navigate = useNavigate();
  const [tab, setTab] = useState('Encontros'),
    [customize, setCustomize] = useState(false),
    [newEvent, setNewEvent] = useState(false),
    [compose, setCompose] = useState(false),
    [remove, setRemove] = useState<string>(),
    [leave, setLeave] = useState(false),
    [newChannel, setNewChannel] = useState(false),
    [channelName, setChannelName] = useState('');
  const { busy, run } = useBusy();
  useEffect(() => setTab('Encontros'), [id]);
  const c = data.communities.find((c) => c.id === id);
  if (!c)
    return (
      <Empty
        title="Comunidade não encontrada"
        text="Esse endereço não corresponde a uma comunidade local."
        action={<Link to="/comunidades">Descobrir comunidades</Link>}
      />
    );
  const owner = data.users.find((u) => u.id === c.ownerId)!,
    isOwner = c.ownerId === userId,
    joined = isMember(data, userId, c.id),
    joinError = membershipError(data, user, 'join'),
    season = seasonKey(now);
  const members = data.users.filter((u) =>
    data.memberships.some((m) => m.communityId === c.id && m.userId === u.id),
  );
  const events = data.events
    .filter((e) => e.communityId === c.id)
    .sort((a, b) => b.start - a.start);
  const territories = data.points.filter((p) => territoryOwner(data, p.id, season) === c.id);
  const posts = data.posts
    .filter((p) => p.communityId === c.id)
    .sort((a, b) => b.createdAt - a.createdAt);
  const tabs = ['Encontros', 'Mural', 'Sobre', 'Membros', ...(isOwner ? ['Administrar'] : [])];
  return (
    <div
      className="community-detail content-page"
      style={{ '--community-accent': accessibleAccent(c.color) } as React.CSSProperties}
    >
      <Link className="back-link" to="/comunidades">
        Comunidades <span>/</span> {c.name}
      </Link>
      <div className="community-hero">
        <Media src={c.cover} alt={`Capa ilustrativa de ${c.name}`} />
        <div className="cover-shade" />
        <div className="community-hero-content">
          <Seal community={c} size={76} />
          <div>
            <span className="community-category">{c.category}</span>
            <h1>{c.name}</h1>
            <p>Um lugar é feito de quem está nele.</p>
          </div>
        </div>
        {isOwner && (
          <Button variant="secondary" className="cover-edit" onClick={() => setCustomize(true)}>
            <PaintBrushIcon size={17} />
            Personalizar
          </Button>
        )}
      </div>
      <div className="community-summary">
        <div className="community-stat">
          <UsersThreeIcon size={18} />
          <strong>{members.length}</strong> membros
        </div>
        <div className="community-stat">
          <MapPinIcon size={18} />
          <strong>{territories.length}</strong> territórios
        </div>
        <div className="community-stat">
          <CalendarBlankIcon size={18} />
          <strong>{events.filter((e) => e.end > now).length}</strong> encontros por vir
        </div>
        <div className="community-main-actions">
          {joined ? (
            <>
              <Link
                className="button button-primary"
                to={`/conversas/${data.conversations.find((conv) => conv.communityId === c.id)?.id}`}
              >
                <ChatCircleDotsIcon size={18} />
                Abrir conversa
              </Link>
              {isOwner ? (
                <Button variant="secondary" onClick={() => setTab('Administrar')}>
                  <GearSixIcon size={18} />
                  Gerenciar
                </Button>
              ) : (
                <IconButton label="Sair da comunidade" onClick={() => setLeave(true)}>
                  <SignOutIcon size={19} />
                </IconButton>
              )}
            </>
          ) : (
            <Button
              onClick={() =>
                void act(() => app.join(userId, c.id), 'Agora você faz parte desta história.')
              }
            >
              <PlusIcon size={18} />
              Fazer parte
            </Button>
          )}
        </div>
      </div>
      {!joined && joinError && (
        <p className="notice">
          {joinError} <Link to="/premium">Conhecer o Premium</Link>
        </p>
      )}
      <div className="tabs" role="tablist" aria-label="Seções da comunidade">
        {tabs.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
            {t}
            {t === 'Encontros' && <span>{events.length}</span>}
          </button>
        ))}
      </div>
      <div className="community-columns">
        <section className="community-main">
          {tab === 'Encontros' && (
            <>
              <div className="section-heading">
                <h2>O próximo capítulo é juntos.</h2>
                {isOwner && (
                  <Button variant="secondary" onClick={() => setNewEvent(true)}>
                    <PlusIcon size={17} />
                    Criar encontro
                  </Button>
                )}
              </div>
              {events.length ? (
                events.map((e) => <EventCard key={e.id} event={e} />)
              ) : (
                <Empty
                  title="Um encontro muda tudo"
                  text="Os encontros desta comunidade vão aparecer aqui."
                  action={
                    isOwner && (
                      <Button onClick={() => setNewEvent(true)}>Criar primeiro encontro</Button>
                    )
                  }
                />
              )}
            </>
          )}
          {tab === 'Mural' && (
            <>
              <div className="section-heading">
                <h2>Histórias da comunidade</h2>
                {isOwner && (
                  <Button onClick={() => setCompose(true)}>
                    <PlusIcon size={17} />
                    Publicar
                  </Button>
                )}
              </div>
              {posts.length ? (
                posts.map((p) => <PostCard key={p.id} post={p} />)
              ) : (
                <Empty
                  title="Toda história tem um começo"
                  text="As publicações da comunidade vão aparecer aqui."
                />
              )}
            </>
          )}
          {tab === 'Sobre' && (
            <div className="about-community">
              <h2>O que nos une</h2>
              <p>{c.description}</p>
              <h3>Quem começou esta história</h3>
              <Link to={`/perfil/${owner.id}`} className="person-row">
                <Avatar user={owner} />
                <span>
                  <strong>{owner.name}</strong>
                  <small>Criador e administrador</small>
                </span>
                <ArrowRightIcon size={18} />
              </Link>
              <h3>Nossos lugares neste mês</h3>
              {territories.length ? (
                territories.map((p) => (
                  <Link className="place-link" to={`/?point=${p.id}`} key={p.id}>
                    <MapPinIcon size={20} />
                    <span>
                      {p.name}
                      <small>{p.neighborhood}</small>
                    </span>
                    <ArrowRightIcon size={17} />
                  </Link>
                ))
              ) : (
                <p className="muted">O primeiro território ainda está por vir.</p>
              )}
            </div>
          )}
          {tab === 'Membros' && (
            <>
              <div className="section-heading">
                <h2>Quem faz este lugar</h2>
                <span className="meta">{members.length} membros</span>
              </div>
              {members.map((u) => (
                <div className="person-row" key={u.id}>
                  <Link to={`/perfil/${u.id}`}>
                    <Avatar user={u} />
                  </Link>
                  <Link to={`/perfil/${u.id}`} className="person-name">
                    <strong>{u.name}</strong>
                    <small>{u.id === c.ownerId ? 'Criador da comunidade' : `@${u.handle}`}</small>
                  </Link>
                  {u.id !== userId && (
                    <Button
                      variant="ghost"
                      onClick={() => void act(() => app.follow(userId, u.id))}
                    >
                      {data.follows.some((f) => f.from === userId && f.to === u.id) ? (
                        <>
                          <CheckIcon size={15} />
                          Seguindo
                        </>
                      ) : (
                        'Seguir'
                      )}
                    </Button>
                  )}
                  {isOwner && u.id !== userId && (
                    <IconButton label={`Remover ${u.name}`} onClick={() => setRemove(u.id)}>
                      <TrashIcon size={17} />
                    </IconButton>
                  )}
                </div>
              ))}
            </>
          )}
          {tab === 'Administrar' && isOwner && (
            <div className="admin-sections">
              <div>
                <h2>Cuide do que vocês constroem.</h2>
                <p className="muted">Você é o administrador de {c.name}.</p>
              </div>
              <div className="admin-action-row">
                <div>
                  <h3>Personalidade da comunidade</h3>
                  <p>Cor, emblema, capa e apresentação.</p>
                </div>
                <Button variant="secondary" onClick={() => setCustomize(true)}>
                  <PaintBrushIcon size={17} />
                  Personalizar
                </Button>
              </div>
              <div className="admin-action-row">
                <div>
                  <h3>Encontros e convites</h3>
                  <p>Defina o lugar, o horário e a memória que fica.</p>
                </div>
                <Button variant="secondary" onClick={() => setNewEvent(true)}>
                  <CalendarBlankIcon size={17} />
                  Criar encontro
                </Button>
              </div>
              <div className="admin-action-row">
                <div>
                  <h3>Conversas da comunidade</h3>
                  <p>Crie espaços para assuntos diferentes.</p>
                </div>
                <Button variant="secondary" onClick={() => setNewChannel(true)}>
                  <PlusIcon size={17} />
                  Criar canal
                </Button>
              </div>
              <div className="admin-action-row">
                <div>
                  <h3>Publicações da comunidade</h3>
                  <p>Compartilhe histórias em nome da comunidade.</p>
                </div>
                <Button variant="secondary" onClick={() => setCompose(true)}>
                  Publicar história
                </Button>
              </div>
              <div className="admin-action-row">
                <div>
                  <h3>Gerenciar membros</h3>
                  <p>Veja quem faz parte e remova membros quando necessário.</p>
                </div>
                <Button variant="secondary" onClick={() => setTab('Membros')}>
                  Ver membros
                </Button>
              </div>
              <p className="form-help">
                Mensagens e publicações podem ser moderadas diretamente na conversa e no mural.
                Contribuições e troféus anteriores permanecem no histórico.
              </p>
            </div>
          )}
        </section>
        <aside className="community-side">
          <div className="side-block">
            <h3>Presença que faz diferença</h3>
            <div className="large-data" style={{ color: accessibleAccent(c.color) }}>
              {formatHours(communityTotal(data, c, season))}
            </div>
            <p>de presença coletiva neste mês.</p>
            <Link className="text-link" to={`/temporada?community=${c.id}`}>
              Ver a temporada
              <ArrowRightIcon size={16} />
            </Link>
          </div>
          <div className="side-block">
            <h3>O que nos une</h3>
            <p>{c.description}</p>
            <div className="small-owner">
              <Avatar user={owner} size={28} />
              <span>
                Criada por <Link to={`/perfil/${owner.id}`}>{owner.name.split(' ')[0]}</Link>
              </span>
            </div>
          </div>
          <div className="side-block">
            <h3>Um território é feito de tempo.</h3>
            <p>
              Os minutos de cada pessoa se somam. Quando vocês superam a presença de outra
              comunidade, o lugar ganha uma nova história.
            </p>
            <Link className="text-link" to="/">
              Explorar o mapa
              <ArrowRightIcon size={16} />
            </Link>
          </div>
        </aside>
      </div>
      {customize && <CommunityForm community={c} onClose={() => setCustomize(false)} />}{' '}
      {newEvent && <EventForm communityId={c.id} onClose={() => setNewEvent(false)} />}{' '}
      {compose && <PostComposer communityId={c.id} onClose={() => setCompose(false)} />}{' '}
      {remove && (
        <Confirm
          title="Remover membro?"
          description="O acesso à comunidade será encerrado. As presenças e conquistas anteriores serão preservadas."
          action="Remover membro"
          onConfirm={() => app.removeMember(userId, remove, c.id)}
          onClose={() => setRemove(undefined)}
        />
      )}{' '}
      {leave && (
        <Confirm
          title="Sair desta comunidade?"
          description="Você deixará de acessar os canais. Suas contribuições e troféus continuarão no histórico."
          action="Sair da comunidade"
          onConfirm={async () => {
            await app.leave(userId, c.id);
            navigate('/comunidades');
          }}
          onClose={() => setLeave(false)}
        />
      )}{' '}
      {newChannel && (
        <Modal title="Um espaço para conversar" onClose={() => setNewChannel(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                const channel = await app.createChannel(userId, c.id, channelName);
                setNewChannel(false);
                navigate(`/conversas/${channel}`);
              }, 'Novo canal criado.');
            }}
          >
            <label>
              Nome do canal
              <input
                required
                maxLength={60}
                autoFocus
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder="Ex.: Planejando o próximo encontro"
              />
            </label>
            <div className="form-actions">
              <Button disabled={busy} type="submit">
                Criar canal
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
