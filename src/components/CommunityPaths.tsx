import { useState } from 'react';
import { ArrowRightIcon, CheckIcon, PlusIcon } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { dateTime, earnedPathEvents, isMember } from '../domain/rules';
import type { Community, CommunityPath, Event } from '../domain/types';
import { app } from '../services/app';
import { Button, Empty, Modal, useApp, useBusy } from './ui';

export function CommunityPaths({ community, events }: { community: Community; events: Event[] }) {
  const { data, userId } = useApp();
  const [creating, setCreating] = useState(false);
  const paths = data.paths.filter((path) => path.communityId === community.id);
  const isAdmin = community.ownerId === userId;

  return (
    <>
      <div className="section-heading">
        <h2>Caminhos</h2>
        {isAdmin && events.length >= 3 && (
          <Button variant="secondary" onClick={() => setCreating(true)}>
            <PlusIcon size={17} />
            Criar caminho
          </Button>
        )}
      </div>
      {paths.length ? (
        <div className="path-list">
          {paths.map((path) => (
            <PathCard key={path.id} path={path} events={events} />
          ))}
        </div>
      ) : (
        <Empty
          title="Nenhum caminho criado"
          text={
            isAdmin && events.length < 3
              ? 'Crie pelo menos três encontros na comunidade para montar um caminho.'
              : 'Os caminhos reúnem três encontros da comunidade em uma mesma jornada.'
          }
        />
      )}
      {creating && (
        <CreatePath community={community} events={events} onClose={() => setCreating(false)} />
      )}
    </>
  );
}

function PathCard({ path, events }: { path: CommunityPath; events: Event[] }) {
  const { data, userId, now } = useApp();
  const { busy, run } = useBusy();
  const started = data.pathEnrollments.some(
    (entry) => entry.pathId === path.id && entry.userId === userId,
  );
  const joined = isMember(data, userId, path.communityId);
  const earned = started ? earnedPathEvents(data, path, userId) : new Set<string>();
  const steps = path.eventIds.map((id) => events.find((event) => event.id === id)!);
  const next =
    started && joined
      ? steps
          .filter((event) => event.end > now && !earned.has(event.id))
          .sort((a, b) => a.start - b.start)[0]
      : undefined;

  return (
    <article className="path-card">
      <header className="path-header">
        <div>
          <h3>{path.title}</h3>
          <p>{path.description}</p>
        </div>
        {started && (
          <span className="path-progress">
            {earned.size === path.eventIds.length && <CheckIcon size={16} weight="bold" />}
            {earned.size} de {path.eventIds.length}
          </span>
        )}
      </header>
      <ol className="path-steps" role="list">
        {steps.map((event, index) => {
          const done = earned.has(event.id);
          const status = done
            ? 'Insígnia conquistada'
            : event.end <= now
              ? started
                ? 'Encerrado sem insígnia'
                : 'Encerrado'
              : event.start <= now
                ? 'Em andamento'
                : dateTime(event.start);

          return (
            <li key={event.id} className={done ? 'path-step-complete' : undefined}>
              <span className="path-step-marker" aria-hidden="true">
                {done ? <CheckIcon size={15} weight="bold" /> : index + 1}
              </span>
              <Link className="path-event" to={`/eventos/${event.id}`}>
                <span>
                  <strong>{event.title}</strong>
                  <span className="meta">{status}</span>
                </span>
                <ArrowRightIcon size={17} aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ol>
      <div className="path-actions">
        {started ? (
          earned.size === path.eventIds.length ? (
            <Link className="button button-secondary" to="/perfil?tab=trofeus">
              Ver em Meus caminhos
            </Link>
          ) : next ? (
            <Link className="button button-primary" to={`/eventos/${next.id}`}>
              {next.start <= now ? 'Abrir encontro em andamento' : 'Ver próximo encontro'}
            </Link>
          ) : (
            <p className="meta">
              {joined
                ? 'Todos os encontros deste caminho terminaram.'
                : 'Você pode rever seu progresso no perfil.'}
            </p>
          )
        ) : joined ? (
          <Button
            disabled={busy}
            onClick={() =>
              void run(() => app.startPath(userId, path.id), 'Você começou o caminho.')
            }
          >
            Começar caminho
          </Button>
        ) : (
          <p className="meta">Faça parte da comunidade para começar.</p>
        )}
      </div>
    </article>
  );
}

function CreatePath({
  community,
  events,
  onClose,
}: {
  community: Community;
  events: Event[];
  onClose: () => void;
}) {
  const { userId } = useApp();
  const { busy, run } = useBusy();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventIds, setEventIds] = useState<CommunityPath['eventIds']>(['', '', '']);

  return (
    <Modal title="Criar caminho" onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void run(async () => {
            await app.createPath(userId, {
              communityId: community.id,
              title,
              description,
              eventIds,
            });
            onClose();
          }, 'Caminho criado.');
        }}
      >
        <label>
          Título
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            maxLength={100}
          />
        </label>
        <label>
          Descrição
          <textarea
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            required
            maxLength={1000}
          />
        </label>
        <p className="meta">Os encontros aparecem nesta ordem. A lista fica fixa após a criação.</p>
        {eventIds.map((selected, index) => (
          <label key={index}>
            {index + 1}º encontro
            <select
              value={selected}
              required
              onChange={(event) => {
                const next: CommunityPath['eventIds'] = [...eventIds];
                next[index] = event.target.value;
                setEventIds(next);
              }}
            >
              <option value="">Selecione um encontro</option>
              {events.map((event) => (
                <option
                  key={event.id}
                  value={event.id}
                  disabled={event.id !== selected && eventIds.includes(event.id)}
                >
                  {event.title} ({dateTime(event.start)})
                </option>
              ))}
            </select>
          </label>
        ))}
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={busy}>
            Criar caminho
          </Button>
        </div>
      </form>
    </Modal>
  );
}
