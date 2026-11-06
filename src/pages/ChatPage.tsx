import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ChatCircleDotsIcon,
  HashIcon,
  LockSimpleIcon,
  MagnifyingGlassIcon,
  PaperPlaneTiltIcon,
  PlusIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import { canModerate, canReadConversation, dateTime, timeOnly } from '../domain/rules';
import { app } from '../services/app';
import { act } from '../state/ui';
import {
  Avatar,
  Button,
  Confirm,
  Empty,
  IconButton,
  Modal,
  Seal,
  useApp,
  useBusy,
} from '../components/ui';
import type { Conversation } from '../domain/types';

export default function ChatPage() {
  const { id } = useParams(),
    { data, userId, user } = useApp(),
    navigate = useNavigate(),
    { busy, run } = useBusy();
  const [search, setSearch] = useState(''),
    [text, setText] = useState(''),
    [newDM, setNewDM] = useState(false),
    [newChannel, setNewChannel] = useState(false),
    [target, setTarget] = useState(''),
    [channelName, setChannelName] = useState(''),
    [channelCommunity, setChannelCommunity] = useState(
      data.communities.find((c) => c.ownerId === userId)?.id ?? '',
    ),
    [remove, setRemove] = useState<string>();
  const scroll = useRef<HTMLDivElement>(null),
    form = useRef<HTMLFormElement>(null);
  const conversations = data.conversations.filter((c) => canReadConversation(data, userId, c.id));
  const selected = id ? conversations.find((c) => c.id === id) : conversations[0];
  const messages = selected
    ? data.messages
        .filter((m) => m.conversationId === selected.id)
        .sort((a, b) => a.createdAt - b.createdAt)
    : [];
  const latest = messages.at(-1)?.id;
  useEffect(() => {
    setText('');
  }, [selected?.id]);
  useEffect(() => {
    if (
      selected &&
      document.visibilityState === 'visible' &&
      (id || matchMedia('(min-width: 701px)').matches)
    )
      void act(() => app.markRead(userId, selected.id));
  }, [selected?.id, latest, userId, id]);
  useEffect(() => {
    if (scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight;
  }, [latest, selected?.id]);
  const name = (c: Conversation) =>
    c.kind === 'dm'
      ? data.users.find((u) => c.participantIds.includes(u.id) && u.id !== userId)!.name
      : c.name;
  const filtered = conversations.filter((c) =>
    `${name(c)} ${data.communities.find((x) => x.id === c.communityId)?.name ?? ''}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const unread = (c: Conversation) =>
    data.messages.filter(
      (m) =>
        m.conversationId === c.id &&
        m.userId !== userId &&
        m.createdAt > (data.reads[`${userId}:${c.id}`] ?? 0),
    ).length;
  const renderConversation = (c: Conversation) => {
    const last = data.messages.filter((m) => m.conversationId === c.id).at(-1),
      community = data.communities.find((x) => x.id === c.communityId),
      other = data.users.find((u) => c.participantIds.includes(u.id) && u.id !== userId),
      count = unread(c);
    return (
      <Link
        className={`conversation-row ${selected?.id === c.id ? 'selected' : ''}`}
        to={`/conversas/${c.id}`}
        key={c.id}
      >
        {community ? <Seal community={community} size={38} /> : <Avatar user={other!} size={38} />}
        <span>
          <strong>
            {c.kind === 'channel' && <HashIcon size={13} />} {name(c)}
          </strong>
          <small>
            {last?.deleted ? 'Mensagem removida' : (last?.text ?? 'Comece uma conversa')}
          </small>
        </span>
        <div className="conversation-trailing">
          {last && <time>{timeOnly(last.createdAt)}</time>}
          {count > 0 && <span className="unread-count">{count}</span>}
        </div>
      </Link>
    );
  };
  const selectedCommunity = data.communities.find((c) => c.id === selected?.communityId),
    other =
      selected?.kind === 'dm'
        ? data.users.find((u) => selected.participantIds.includes(u.id) && u.id !== userId)
        : undefined;
  const owned = data.communities.filter((c) => c.ownerId === userId);
  return (
    <div className={`chat-page ${id ? 'chat-has-selected' : ''}`}>
      <aside className="chat-list">
        <div className="chat-list-heading">
          <div>
            <h1>Conversas</h1>
            <p>Onde os encontros continuam.</p>
          </div>
          <IconButton label="Nova conversa privada" onClick={() => setNewDM(true)}>
            <PlusIcon size={21} />
          </IconButton>
        </div>
        <label className="search-field">
          <MagnifyingGlassIcon size={18} />
          <input
            placeholder="Buscar uma conversa"
            aria-label="Buscar uma conversa"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <div className="conversation-groups">
          {data.communities
            .filter((c) => filtered.some((conv) => conv.communityId === c.id))
            .map((c) => (
              <div className="conversation-group" key={c.id}>
                <div className="conversation-group-title">
                  <Link to={`/comunidades/${c.id}`}>{c.name}</Link>
                  {c.ownerId === userId && (
                    <IconButton
                      label={`Criar canal em ${c.name}`}
                      onClick={() => {
                        setChannelCommunity(c.id);
                        setNewChannel(true);
                      }}
                    >
                      <PlusIcon size={15} />
                    </IconButton>
                  )}
                </div>
                {filtered.filter((conv) => conv.communityId === c.id).map(renderConversation)}
              </div>
            ))}
          <div className="conversation-group">
            <div className="conversation-group-title">
              <span>Conversas privadas</span>
              <LockSimpleIcon size={14} />
            </div>
            {filtered.filter((c) => c.kind === 'dm').map(renderConversation)}
            {!filtered.some((c) => c.kind === 'dm') && (
              <p className="small-list-empty">Uma conversa pode começar uma amizade.</p>
            )}
          </div>
          {!filtered.length && (
            <Empty
              title="Nenhuma conversa por aqui"
              text="Entre em uma comunidade ou mande uma mensagem privada."
              action={
                <Button variant="secondary" onClick={() => setNewDM(true)}>
                  Nova conversa
                </Button>
              }
            />
          )}
        </div>
        <div className="chat-list-footer">
          <ChatCircleDotsIcon size={17} />
          <span>Encontros passam. Conversas ficam.</span>
        </div>
      </aside>
      <section className="chat-conversation">
        {selected ? (
          <>
            <div className="chat-header">
              <Link
                to="/conversas"
                className="icon-button chat-back"
                aria-label="Voltar para as conversas"
              >
                <ArrowLeftIcon size={20} />
              </Link>
              {selectedCommunity ? (
                <Seal community={selectedCommunity} size={40} />
              ) : (
                <Avatar user={other!} />
              )}
              <div>
                <h2>{name(selected)}</h2>
                <span>
                  {selectedCommunity ? (
                    <Link to={`/comunidades/${selectedCommunity.id}`}>
                      {selectedCommunity.name} ·{' '}
                      {
                        data.memberships.filter((m) => m.communityId === selectedCommunity.id)
                          .length
                      }{' '}
                      membros
                    </Link>
                  ) : (
                    'Conversa privada · 2 participantes'
                  )}
                </span>
              </div>
              {other && (
                <Link className="button button-ghost" to={`/perfil/${other.id}`}>
                  Ver perfil
                </Link>
              )}
            </div>
            <div className="chat-messages" ref={scroll}>
              <div className="conversation-start">
                <ChatCircleDotsIcon size={30} />
                <h3>
                  {selected.kind === 'dm'
                    ? 'Uma boa conversa começa aqui.'
                    : 'Aqui, a comunidade se encontra.'}
                </h3>
                <p>
                  {selected.kind === 'dm'
                    ? `Este é o espaço de ${user.name.split(' ')[0]} e ${other?.name.split(' ')[0]}.`
                    : 'Planeje o próximo encontro, compartilhe uma ideia ou só diga oi.'}
                </p>
              </div>
              {messages.map((m, index) => {
                const author = data.users.find((u) => u.id === m.userId)!,
                  mine = m.userId === userId,
                  newDay =
                    index === 0 ||
                    new Date(m.createdAt).toDateString() !==
                      new Date(messages[index - 1].createdAt).toDateString();
                return (
                  <div key={m.id}>
                    {newDay && (
                      <div className="message-day">{dateTime(m.createdAt).split(',')[0]}</div>
                    )}
                    <div className={`message-row ${mine ? 'own-message' : ''}`}>
                      {!mine && <Avatar user={author} size={30} link />}
                      <div className={`message-bubble ${m.deleted ? 'message-deleted' : ''}`}>
                        {!mine && (
                          <Link to={`/perfil/${author.id}`} className="message-author">
                            {author.name.split(' ')[0]}
                          </Link>
                        )}
                        <p>{m.deleted ? 'Mensagem removida' : m.text}</p>
                        <time>{timeOnly(m.createdAt)}</time>
                      </div>
                      {!m.deleted && (mine || canModerate(data, userId, selected.communityId)) && (
                        <IconButton label="Excluir mensagem" onClick={() => setRemove(m.id)}>
                          <TrashIcon size={14} />
                        </IconButton>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <form
              ref={form}
              className="chat-composer"
              onSubmit={(e) => {
                e.preventDefault();
                void run(async () => {
                  await app.send(userId, selected.id, text);
                  setText('');
                });
              }}
            >
              <textarea
                rows={1}
                aria-label="Sua mensagem"
                placeholder={`Converse em ${name(selected)}…`}
                value={text}
                maxLength={4000}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (text.trim() && !busy) form.current?.requestSubmit();
                  }
                }}
              />
              <button
                type="submit"
                className="send-button"
                disabled={busy || !text.trim()}
                aria-label="Enviar mensagem"
              >
                <PaperPlaneTiltIcon size={21} weight="fill" />
              </button>
            </form>
            <p className="chat-local-note">
              Conversas locais. Troque o perfil em “Demonstração” para responder como outra pessoa.
            </p>
          </>
        ) : (
          <Empty
            title={id ? 'Esta conversa não está disponível' : 'Vamos conversar?'}
            text={
              id
                ? 'Seu perfil não tem acesso a esta conversa. Escolha outra na lista.'
                : 'Entre em uma comunidade ou inicie uma conversa privada.'
            }
            action={<Button onClick={() => setNewDM(true)}>Nova conversa</Button>}
          />
        )}
      </section>
      {newDM && (
        <Modal title="Toda história começa com um oi" onClose={() => setNewDM(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                const id = await app.dm(userId, target);
                setNewDM(false);
                navigate(`/conversas/${id}`);
              });
            }}
          >
            <label>
              Com quem você quer conversar?
              <select required value={target} onChange={(e) => setTarget(e.target.value)}>
                <option value="">Escolha uma pessoa</option>
                {data.users
                  .filter((u) => u.id !== userId)
                  .map((u) => (
                    <option value={u.id} key={u.id}>
                      {u.name} · @{u.handle}
                    </option>
                  ))}
              </select>
            </label>
            <div className="form-actions">
              <Button type="submit" disabled={busy || !target}>
                Iniciar conversa
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {newChannel && (
        <Modal title="Crie um espaço para conversar" onClose={() => setNewChannel(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                const id = await app.createChannel(userId, channelCommunity, channelName);
                setNewChannel(false);
                setChannelName('');
                navigate(`/conversas/${id}`);
              }, 'Canal criado.');
            }}
          >
            <label>
              Comunidade
              <select
                required
                value={channelCommunity}
                onChange={(e) => setChannelCommunity(e.target.value)}
              >
                {owned.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Nome do canal
              <input
                required
                maxLength={60}
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder="Ex.: Café depois da corrida"
              />
            </label>
            <div className="form-actions">
              <Button type="submit" disabled={busy}>
                Criar canal
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {remove && (
        <Confirm
          title="Remover esta mensagem?"
          description="A conversa mostrará que a mensagem foi removida."
          action="Remover mensagem"
          onConfirm={() => app.deleteMessage(userId, remove)}
          onClose={() => setRemove(undefined)}
        />
      )}
    </div>
  );
}
