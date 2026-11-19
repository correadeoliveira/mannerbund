import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarBlankIcon,
  CheckCircleIcon,
  ClockIcon,
  FlagBannerIcon,
  MapPinIcon,
  PaperPlaneTiltIcon,
  PauseIcon,
  PlayIcon,
} from '@phosphor-icons/react';
import { Button, Confirm, Empty, Seal, useBusy } from '../components/ui';
import {
  communityScores,
  MINUTE,
  presenceDuration,
  seasonKey,
  territoryOwner,
  timeOnly,
} from '../domain/rules';
import { GuildAvatar, GuildMedal } from './Identity';
import { act } from '../state/ui';
import { actors, channelId, guilds, visitorId, type GuildScript } from './scripts';
import { nextCue } from './experience';
import { useGuild } from './context';
import { guestGuild, worldTime, type Visit } from './world';

function useConversationCue(id: string, key?: string) {
  const { actions } = useGuild();
  useEffect(() => {
    if (!key) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      clearTimeout(timer);
      if (document.visibilityState === 'visible')
        timer = setTimeout(
          () => {
            if (document.visibilityState === 'visible') void act(() => actions.cue(id, key));
          },
          key.startsWith('resposta') ? 650 : 3500,
        );
    };
    schedule();
    document.addEventListener('visibilitychange', schedule);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', schedule);
    };
  }, [actions, id, key]);
}

function Conversation({
  script,
  visit,
  joined,
}: {
  script: GuildScript;
  visit?: Visit;
  joined: boolean;
}) {
  const { world, actions } = useGuild();
  const [text, setText] = useState('');
  const { busy, run } = useBusy();
  const id = script.communityId,
    messages = world.messages.filter((m) => m.conversationId === channelId(id));
  useConversationCue(id, joined ? nextCue(visit) : undefined);
  const send = (message: string) =>
    void run(async () => {
      await actions.chat(id, message);
      setText('');
    });
  return (
    <section id="conversa" className="guild-section" tabIndex={-1} aria-label="Conversa da guilda">
      <div className="guild-section-head">
        <h2>Conversa da guilda</h2>
        {joined && visit && visit.stage !== 'finished' && (
          <Button
            variant="ghost"
            aria-pressed={visit.paused}
            onClick={() => void act(() => actions.pause(id, !visit.paused))}
          >
            {visit.paused ? <PlayIcon /> : <PauseIcon />}
            {visit.paused ? 'Retomar simulação' : 'Pausar simulação'}
          </Button>
        )}
      </div>
      {joined && visit ? (
        <>
          <div
            className="guild-transcript"
            role="log"
            aria-label="Mensagens da guilda"
            aria-live="polite"
            tabIndex={0}
            ref={(el) => {
              if (el && el.dataset.last !== messages.at(-1)?.id) {
                const bottom = el.scrollHeight - el.clientHeight - el.scrollTop < 140;
                if (bottom || messages.at(-1)?.userId === visitorId || !el.dataset.last)
                  el.scrollTop = el.scrollHeight;
                el.dataset.last = messages.at(-1)?.id;
              }
            }}
          >
            {messages.map((m) => {
              const u = world.users.find((u) => u.id === m.userId)!;
              return (
                <div className="guild-line" key={m.id}>
                  <GuildAvatar user={u} size={32} />
                  <div>
                    <Link to={'/guildas/perfil/' + u.id}>{u.name}</Link>
                    <p>{m.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
          {visit.paused && (
            <p className="guild-note" role="status">
              Os personagens aguardam. Retome a simulação para receber as respostas.
            </p>
          )}
          {visit.stage === 'finished' ? (
            <p className="guild-note">Conversa do encontro encerrada.</p>
          ) : (
            <>
              {visit.stage === 'invited' && (
                <a href="#encontro" className="guild-invite-link">
                  <CalendarBlankIcon /> Abrir convite para {script.title} <ArrowRightIcon />
                </a>
              )}
              <div className="guild-replies">
                {['Onde a gente se encontra?', 'É minha primeira vez'].map((q) => (
                  <button disabled={busy} key={q} onClick={() => send(q)}>
                    {q}
                  </button>
                ))}
              </div>
              <form
                className="guild-compose"
                onSubmit={(e) => {
                  e.preventDefault();
                  send(text);
                }}
              >
                <label className="sr-only" htmlFor="guild-message">
                  Sua mensagem
                </label>
                <input
                  id="guild-message"
                  maxLength={4000}
                  value={text}
                  placeholder="Escreva para o grupo…"
                  onChange={(e) => setText(e.target.value)}
                />
                <Button aria-label="Enviar mensagem" disabled={busy || !text.trim()}>
                  <PaperPlaneTiltIcon />
                </Button>
              </form>
            </>
          )}
        </>
      ) : (
        <p>Faça parte da comunidade para conversar com o grupo.</p>
      )}
    </section>
  );
}

function Encounter({
  script,
  visit,
  joined,
  join,
}: {
  script: GuildScript;
  visit?: Visit;
  joined: boolean;
  join: () => void;
}) {
  const { world, actions } = useGuild();
  const { busy, run } = useBusy();
  const [early, setEarly] = useState(false);
  const id = script.communityId,
    point = world.points.find((p) => p.id === script.pointId)!;
  const season = seasonKey(worldTime(world)),
    scores = communityScores(world, point.id, season);
  const total = (scores.find((s) => s.communityId === id)?.duration ?? 0) / MINUTE;
  const rival = scores.find((s) => s.communityId !== id)!;
  const rivalMinutes = rival.duration / MINUTE;
  const won = territoryOwner(world, point.id, season) === id;
  const event = world.events.find((e) => e.id === visit?.eventId);
  const arrived = world.presences.filter((p) => p.eventId && p.eventId === event?.id);
  const trophy = world.badges.find((b) => b.userId === visitorId && b.eventId === event?.id);
  const paused = visit?.paused,
    complete = visit?.stage === 'finished';
  return (
    <section className="guild-encounter guild-panel" id="encontro">
      <p className="guild-kicker">
        <CalendarBlankIcon />
        {complete ? 'Encontro encerrado' : 'Convite para o encontro'}
      </p>
      <h2>{script.title}</h2>
      <Link className="guild-location" to={'/guildas/mapa?point=' + point.id}>
        <MapPinIcon />
        {point.name}
        <ArrowRightIcon />
      </Link>
      <p>{script.meeting}</p>
      <p className="guild-duration">
        <ClockIcon />
        {event ? timeOnly(event.start) + ' · ' : ''}30 min simulados ·{' '}
        {event?.acceptedIds.length ?? 0} confirmados
      </p>
      {visit?.stage === 'confirmed' && (
        <p className="guild-rsvp">
          <CheckCircleIcon /> {script.members.map((name) => name.split(' ')[0]).join(', ')} e você
          confirmaram.
        </p>
      )}
      <div className="guild-score">
        <div>
          <FlagBannerIcon />
          <strong>{won ? 'Território conquistado' : 'Disputa do território'}</strong>
        </div>
        <div className="guild-score-line">
          <span>Esta guilda</span>
          <strong>{total} min</strong>
        </div>
        <progress
          value={total}
          max={Math.max(total, rivalMinutes + 1)}
          aria-label="Minutos coletivos desta guilda"
        />
        <div className="guild-score-line">
          <span>{world.communities.find((c) => c.id === rival.communityId)?.name}</span>
          <span>{rivalMinutes} min</span>
        </div>
        {!won && (
          <small>
            Faltam {Math.floor(rivalMinutes - total) + 1} minutos coletivos para assumir o domínio.
          </small>
        )}
      </div>
      {arrived.length > 0 && (
        <ul className="guild-roll" aria-label="Contribuições do encontro">
          {arrived.map((p) => (
            <li key={p.id}>
              <span>
                <CheckCircleIcon />
                {p.userId === visitorId ? 'Você' : world.users.find((u) => u.id === p.userId)?.name}
              </span>
              <strong>{presenceDuration(p) / MINUTE} min</strong>
            </li>
          ))}
        </ul>
      )}
      {complete && (
        <div className="guild-prize">
          {trophy && (
            <GuildMedal badge={trophy} community={world.communities.find((c) => c.id === id)!} />
          )}
          <div>
            <strong>{trophy?.title ?? 'Insígnia pendente'}</strong>
            <p>
              {trophy
                ? trophy.description
                : 'A insígnia deste encontro exige 30 minutos de presença.'}
            </p>
            <Link
              className="text-link"
              to={'/guildas/perfil?tab=' + (trophy ? 'trofeus' : 'lugares')}
            >
              {trophy ? 'Ver meu troféu' : 'Ver minhas visitas'} <ArrowRightIcon />
            </Link>
          </div>
        </div>
      )}
      {!joined ? (
        <Button className="full-width" onClick={join}>
          Fazer parte <ArrowRightIcon />
        </Button>
      ) : complete ? (
        <Link className="button button-secondary full-width" to={'/guildas/mapa?point=' + point.id}>
          Ver domínio no mapa <ArrowRightIcon />
        </Link>
      ) : paused ? (
        <Button className="full-width" onClick={() => void run(() => actions.pause(id, false))}>
          Retomar simulação
        </Button>
      ) : visit?.stage === 'invited' ? (
        <Button
          className="full-width"
          disabled={busy}
          onClick={() => void run(() => actions.confirm(id))}
        >
          Confirmar convite
        </Button>
      ) : visit?.stage === 'confirmed' ? (
        <Button
          className="full-width"
          disabled={busy}
          onClick={() => void run(() => actions.arrive(id))}
        >
          Cheguei ao local
        </Button>
      ) : visit?.stage === 'present' ? (
        <>
          <Button
            className="full-width"
            disabled={busy}
            onClick={() => void run(() => actions.finish(id, 30))}
          >
            <ClockIcon />
            Simular 30 minutos juntos
          </Button>
          <button className="guild-early" onClick={() => setEarly(true)}>
            Sair após 10 minutos
          </button>
        </>
      ) : null}
      {early && (
        <Confirm
          title="Sair mais cedo do encontro?"
          description="Você contribui com 10 minutos. Os outros dois participantes ficam os 30 minutos completos."
          action="Simular saída antecipada"
          onConfirm={() => actions.finish(id, 10)}
          onClose={() => setEarly(false)}
        />
      )}
    </section>
  );
}

export function GuildVisit() {
  const { id } = useParams();
  const { world, actions } = useGuild();
  const [leaving, setLeaving] = useState<string>();
  const [welcomeFor, setWelcomeFor] = useState<string>();
  const current = guestGuild(world);
  useEffect(() => {
    if (welcomeFor && id === welcomeFor && current === id && !leaving) {
      const section = document.getElementById('conversa');
      section?.focus({ preventScroll: true });
      section?.scrollIntoView({ block: 'nearest' });
      setWelcomeFor(undefined);
    }
  }, [welcomeFor, id, current, leaving]);
  const c = world.communities.find((c) => c.id === id),
    script = guilds.find((g) => g.communityId === id);
  if (!c || !script)
    return (
      <Empty
        title="Guilda não encontrada"
        text="As seis comunidades estão no guia de visitas."
        action={<Link to="/guildas">Ver guildas</Link>}
      />
    );
  const joined = current === c.id,
    visit = world.visits[c.id];
  const host = world.users.find((u) => u.id === c.ownerId)!;
  const enter = async (previous?: string) => {
    await actions.join(c.id, previous);
    if (!world.visits[c.id]) setWelcomeFor(c.id);
  };
  const join = () => {
    if (current && !joined) setLeaving(current);
    else void act(() => enter());
  };
  return (
    <div key={c.id} className="guild-detail">
      <Link className="guild-back" to="/guildas">
        <ArrowLeftIcon /> Todas as guildas
      </Link>
      <header className="guild-banner">
        <img src={c.cover} alt="" />
        <div>
          <Seal community={c} size={60} />
          <p>{c.category}</p>
          <h1>{c.name}</h1>
          <p>{c.description}</p>
        </div>
      </header>
      <nav className="guild-local-nav" aria-label="Seções da guilda">
        <a href="#encontro">Encontro</a>
        <a href="#conversa">Conversa</a>
        <a href="#mural">Mural</a>
        <a href="#membros">Membros</a>
      </nav>
      <div className="guild-visit-grid">
        <Encounter key={c.id} script={script} visit={visit} joined={joined} join={join} />
        <div>
          <Conversation key={c.id} script={script} visit={visit} joined={joined} />
          <section className="guild-section" id="mural">
            <h2>Mural</h2>
            {world.posts
              .filter((p) => p.communityId === c.id)
              .reverse()
              .map((p) => (
                <article key={p.id} className="guild-notice">
                  <Seal community={c} size={35} />
                  <div>
                    <strong>{host.name}</strong>
                    <small>Organização da guilda · {timeOnly(p.createdAt)}</small>
                    <p>{p.text}</p>
                  </div>
                </article>
              ))}
          </section>
          <section className="guild-section" id="membros">
            <h2>Membros</h2>
            <div className="guild-members">
              {[host.id, ...actors(c.id), ...(joined ? [visitorId] : [])].map((uid) => {
                const u = world.users.find((u) => u.id === uid)!;
                return (
                  <Link key={uid} to={'/guildas/perfil/' + uid}>
                    <GuildAvatar user={u} size={38} />
                    <span>
                      <strong>{u.name}</strong>
                      <small>
                        {uid === visitorId
                          ? 'Você'
                          : uid === host.id
                            ? 'Organiza o encontro · personagem simulado'
                            : 'Personagem simulado'}
                      </small>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </div>
      {leaving && (
        <Confirm
          title={'Trocar para ' + c.name + '?'}
          description={
            'Sua vaga gratuita está em ' +
            world.communities.find((other) => other.id === leaving)?.name +
            '. Ao sair, suas visitas e troféus continuam no perfil.' +
            (world.visits[leaving]?.stage === 'present'
              ? ' Seu check-in será encerrado agora e os personagens simularão o restante do encontro.'
              : '')
          }
          action="Sair e fazer parte"
          onConfirm={() => enter(leaving)}
          onClose={() => setLeaving(undefined)}
        />
      )}
    </div>
  );
}
