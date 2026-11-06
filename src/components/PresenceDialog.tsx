import { useState } from 'react';
import { BroadcastIcon, MapPinIcon, PlayCircleIcon } from '@phosphor-icons/react';
import { app } from '../services/app';
import { Button, Modal, useApp, useBusy } from './ui';
import type { Event, Point } from '../domain/types';
import { isMember } from '../domain/rules';
import { useUI } from '../state/ui';

export function PresenceDialog({
  point,
  event,
  onClose,
}: {
  point: Point;
  event?: Event;
  onClose: () => void;
}) {
  const { data, userId } = useApp(),
    { busy, run } = useBusy(),
    toggleDemo = useUI((s) => s.toggleDemo),
    demoOpen = useUI((s) => s.demoOpen);
  const communities = data.communities.filter((c) => isMember(data, userId, c.id));
  const [communityId, setCommunityId] = useState(event?.communityId ?? communities[0]?.id ?? ''),
    [source, setSource] = useState<'demo' | 'gps'>('demo');
  return (
    <Modal title={event ? 'Registrar presença no encontro' : 'Ocupe seu lugar'} onClose={onClose}>
      <div className="location-banner">
        <MapPinIcon size={24} />
        <div>
          <strong>{point.name}</strong>
          <span>Área de presença de {point.radius} metros</span>
        </div>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run(async () => {
            await app.startPresence(userId, point.id, communityId, source, event?.id);
            if (source === 'demo' && !demoOpen) toggleDemo();
            onClose();
          }, 'Presença iniciada. Seu tempo junto faz a diferença.');
        }}
      >
        <label>
          Comunidade
          <select
            value={communityId}
            onChange={(e) => setCommunityId(e.target.value)}
            disabled={!!event}
            required
          >
            {communities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <div className="mode-options">
          <button
            type="button"
            className={source === 'demo' ? 'mode-option selected' : 'mode-option'}
            onClick={() => setSource('demo')}
          >
            <PlayCircleIcon size={24} />
            <strong>Demonstração</strong>
            <span>Explore no PC e avance o tempo sem sair do lugar.</span>
          </button>
          <button
            type="button"
            className={source === 'gps' ? 'mode-option selected' : 'mode-option'}
            onClick={() => setSource('gps')}
          >
            <BroadcastIcon size={24} />
            <strong>Minha localização</strong>
            <span>Solicita permissão e valida sua posição dentro do raio.</span>
          </button>
        </div>
        <p className="form-help">
          {source === 'demo'
            ? 'Presença simulada, identificada como demonstração. Nenhuma localização será solicitada.'
            : 'Só contam intervalos com posições recentes e precisas dentro da área. Mantenha esta página aberta e visível. A localização do PC pode ser imprecisa.'}
        </p>
        {event && <p className="notice">Esta presença conta para a insígnia de “{event.title}”.</p>}
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={busy || !communityId}>
            {busy ? 'Iniciando…' : 'Iniciar presença'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
