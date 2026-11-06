import { lazy, Suspense, useMemo, useState } from 'react';
import { MapPinIcon, PlusIcon } from '@phosphor-icons/react';
import type { Event } from '../domain/types';
import { distanceMeters, HOUR, MINUTE } from '../domain/rules';
import { app } from '../services/app';
import { Button, ImageUpload, Modal, useApp, useBusy } from './ui';

const MapCanvas = lazy(() => import('./MapCanvas'));
const toLocal = (t: number) => new Date(t - 3 * HOUR).toISOString().slice(0, 16);
const fromLocal = (s: string) => new Date(`${s}:00-03:00`).getTime();

export function EventForm({
  communityId,
  event,
  onClose,
}: {
  communityId: string;
  event?: Event;
  onClose: () => void;
}) {
  const { data, userId, now } = useApp(),
    { busy, run } = useBusy();
  const [title, setTitle] = useState(event?.title ?? ''),
    [description, setDescription] = useState(event?.description ?? ''),
    [pointId, setPointId] = useState(event?.pointId ?? data.points[0].id),
    [start, setStart] = useState(toLocal(event?.start ?? now + HOUR)),
    [end, setEnd] = useState(toLocal(event?.end ?? now + 2 * HOUR)),
    [minimum, setMinimum] = useState(event?.minimumMinutes ?? 30),
    [badgeTitle, setBadgeTitle] = useState(event?.badgeTitle ?? ''),
    [badgeDescription, setBadgeDescription] = useState(event?.badgeDescription ?? ''),
    [badgeImage, setBadgeImage] = useState(event?.badgeImage ?? '/images/medallion.jpg'),
    [pointForm, setPointForm] = useState(false);
  const members = data.users.filter((u) =>
    data.memberships.some((m) => m.communityId === communityId && m.userId === u.id),
  );
  const [invited, setInvited] = useState(event?.invitedIds ?? members.map((u) => u.id));
  return (
    <Modal
      title={event ? 'Editar encontro' : 'Um novo motivo para se encontrar'}
      onClose={onClose}
      wide
    >
      <form
        className="event-form"
        onSubmit={(e) => {
          e.preventDefault();
          void run(async () => {
            await app.createEvent(
              userId,
              {
                title,
                description,
                pointId,
                communityId,
                start: fromLocal(start),
                end: fromLocal(end),
                minimumMinutes: minimum,
                badgeTitle,
                badgeDescription,
                badgeImage,
                invitedIds: invited,
              },
              event?.id,
            );
            onClose();
          }, 'Encontro salvo. Os convites estão na comunidade.');
        }}
      >
        <div className="form-fields">
          <label>
            Nome do encontro
            <input
              required
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Que história vamos construir?"
            />
          </label>
          <label>
            Sobre o encontro
            <textarea
              required
              rows={3}
              maxLength={1500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <label>
            Onde vocês vão se encontrar?
            <select value={pointId} onChange={(e) => setPointId(e.target.value)}>
              {data.points.map((p) => (
                <option value={p.id} key={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <Button type="button" variant="ghost" onClick={() => setPointForm(true)}>
            <PlusIcon size={16} />
            Cadastrar ou escolher no mapa
          </Button>
          <div className="field-row">
            <label>
              Início
              <input
                type="datetime-local"
                required
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </label>
            <label>
              Fim
              <input
                type="datetime-local"
                required
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </label>
          </div>
          <small className="form-help">
            Horários de São Paulo. Depois do início, as regras ficam preservadas.
          </small>
          <fieldset>
            <legend>Convide os membros</legend>
            <div className="invite-list">
              {members.map((u) => (
                <label key={u.id} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={invited.includes(u.id)}
                    onChange={() =>
                      setInvited((v) =>
                        v.includes(u.id) ? v.filter((id) => id !== u.id) : [...v, u.id],
                      )
                    }
                  />
                  {u.name}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <div className="form-fields badge-form">
          <h3>A memória que fica</h3>
          <p className="muted">Uma insígnia exclusiva para quem fizer parte deste encontro.</p>
          <ImageUpload
            value={badgeImage}
            onChange={setBadgeImage}
            label="Escolher imagem da insígnia"
          />
          <label>
            Título da insígnia
            <input
              required
              maxLength={80}
              value={badgeTitle}
              onChange={(e) => setBadgeTitle(e.target.value)}
              placeholder="Ex.: Guardiões da aurora"
            />
          </label>
          <label>
            Descrição da conquista
            <textarea
              required
              rows={2}
              maxLength={500}
              value={badgeDescription}
              onChange={(e) => setBadgeDescription(e.target.value)}
            />
          </label>
          <label>
            Presença mínima em minutos
            <input
              required
              type="number"
              min={1}
              max={Math.max(1, Math.floor((fromLocal(end) - fromLocal(start)) / MINUTE))}
              value={minimum}
              onChange={(e) => setMinimum(Number(e.target.value))}
            />
          </label>
          <small className="form-help">
            Conta apenas o tempo dentro da área e do horário do evento, com convite confirmado.
          </small>
        </div>
        <div className="form-actions form-full">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? 'Salvando…' : event ? 'Salvar encontro' : 'Criar encontro e convites'}
          </Button>
        </div>
      </form>
      {pointForm && (
        <PointForm
          communityId={communityId}
          onClose={() => setPointForm(false)}
          onSelect={(id) => {
            setPointId(id);
            setPointForm(false);
          }}
        />
      )}
    </Modal>
  );
}
function PointForm({
  communityId,
  onClose,
  onSelect,
}: {
  communityId: string;
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const { data, userId } = useApp(),
    { busy, run } = useBusy();
  const [position, setPosition] = useState({ lat: -23.565, lng: -46.67 }),
    [name, setName] = useState(''),
    [neighborhood, setNeighborhood] = useState('');
  const nearby = useMemo(
    () =>
      data.points
        .map((p) => ({ ...p, distance: distanceMeters(p, position) }))
        .filter((p) => p.distance < 1000)
        .sort((a, b) => a.distance - b.distance),
    [data, position],
  );
  const owners = useMemo(() => ({}), []);
  return (
    <Modal title="Escolha um lugar no mapa" onClose={onClose} wide>
      <div className="point-picker-map">
        <Suspense fallback={<span>Preparando mapa…</span>}>
          <MapCanvas
            points={data.points}
            owners={owners}
            onSelect={onSelect}
            location={position}
            onPick={setPosition}
          />
        </Suspense>
        <div className="picked-coordinates">
          <MapPinIcon size={17} />
          Clique no mapa para posicionar o novo point.
        </div>
      </div>
      <div className="field-row">
        <label>
          Latitude
          <input
            type="number"
            step="any"
            value={position.lat}
            onChange={(e) => setPosition((p) => ({ ...p, lat: Number(e.target.value) }))}
          />
        </label>
        <label>
          Longitude
          <input
            type="number"
            step="any"
            value={position.lng}
            onChange={(e) => setPosition((p) => ({ ...p, lng: Number(e.target.value) }))}
          />
        </label>
      </div>
      <p className="form-help">
        Novo point: {position.lat.toFixed(5)}, {position.lng.toFixed(5)} · raio de 100 metros.
      </p>
      {nearby.length > 0 && (
        <div className="nearby-reuse">
          <h3>Já existe um point por perto</h3>
          {nearby.map((p) => (
            <button key={p.id} onClick={() => onSelect(p.id)}>
              <span>
                {p.name}
                <small>{Math.round(p.distance)} m do ponto escolhido</small>
              </span>
              <span>Usar este local</span>
            </button>
          ))}
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run(async () => {
            const id = await app.createPoint(userId, communityId, {
              ...position,
              name,
              neighborhood,
            });
            onSelect(id);
          }, 'Novo point cadastrado.');
        }}
      >
        <div className="field-row">
          <label>
            Nome do novo local
            <input required value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Bairro
            <input
              required
              value={neighborhood}
              maxLength={60}
              onChange={(e) => setNeighborhood(e.target.value)}
            />
          </label>
        </div>
        <div className="form-actions">
          <Button variant="secondary" type="button" onClick={onClose}>
            Voltar
          </Button>
          <Button type="submit" disabled={busy || nearby.some((p) => p.distance < 100)}>
            Cadastrar novo point
          </Button>
        </div>
      </form>
    </Modal>
  );
}
