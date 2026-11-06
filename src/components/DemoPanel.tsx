import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRightIcon,
  CheckCircleIcon,
  FlaskIcon,
  MapPinIcon,
  PauseCircleIcon,
  PlayIcon,
  SignOutIcon,
  UsersThreeIcon,
  XIcon,
} from '@phosphor-icons/react';
import {
  formatHours,
  isMember,
  MINUTE,
  presenceDuration,
  seasonBounds,
  seasonKey,
} from '../domain/rules';
import { resetDemo } from '../data/database';
import { app } from '../services/app';
import { browserLocation } from '../services/location';
import { act, useUI } from '../state/ui';
import { Avatar, Button, Confirm, IconButton, Modal, useApp } from './ui';

export function PersonaPicker({ onClose }: { onClose: () => void }) {
  const { data, userId } = useApp(),
    switchUser = useUI((s) => s.switchUser),
    navigate = useNavigate();
  return (
    <Modal title="Veja a história por outro lado" onClose={onClose}>
      <p className="muted">
        Perfis locais para explorar o protótipo. Todos compartilham os dados deste navegador.
      </p>
      <div className="persona-list">
        {data.users.map((u) => (
          <button
            className={`person-row ${u.id === userId ? 'selected' : ''}`}
            key={u.id}
            onClick={() => {
              void act(
                async () => {
                  await app.pausePresence(userId);
                  switchUser(u.id);
                  navigate('/');
                  onClose();
                },
                `Agora você está explorando como ${u.name.split(' ')[0]}.`,
              );
            }}
          >
            <Avatar user={u} />
            <span className="person-name">
              <strong>{u.name}</strong>
              <small>
                {data.communities
                  .filter((c) => c.ownerId === u.id)
                  .map((c) => `ADM de ${c.name}`)
                  .join(', ') || 'Novo membro · ideal para criar uma comunidade'}
              </small>
            </span>
            {u.id === userId ? <CheckCircleIcon size={20} /> : <ArrowRightIcon size={18} />}
          </button>
        ))}
      </div>
    </Modal>
  );
}
export function PresenceMonitor() {
  const { data, userId } = useApp(),
    active = data.presences.find((p) => p.userId === userId && !p.endedAt),
    [error, setError] = useState('');
  useEffect(() => {
    setError('');
    if (!active || active.source !== 'gps') return;
    let disposed = false;
    const stop = browserLocation.watch(
      (sample) => {
        if (disposed) return;
        void act(async () => {
          const valid = await app.sample(userId, sample, document.visibilityState === 'visible');
          if (!disposed)
            setError(valid ? '' : 'Fora da área ou precisão insuficiente. O tempo está pausado.');
        });
      },
      (message) => {
        if (!disposed) {
          setError(message);
          void act(() => app.pausePresence(userId));
        }
      },
    );
    const visibility = () => {
      if (document.visibilityState !== 'visible') void act(() => app.pausePresence(userId));
    };
    document.addEventListener('visibilitychange', visibility);
    return () => {
      disposed = true;
      stop();
      document.removeEventListener('visibilitychange', visibility);
      void act(() => app.pausePresence(userId));
    };
  }, [active?.id, active?.source, userId]);
  useEffect(() => {
    if (!active || active.source !== 'gps') return;
    const t = setInterval(() => {
      if (Date.now() + data.clockOffset - active.lastSampleAt > 30000 && active.lastValid)
        void act(() => app.pausePresence(userId));
    }, 5000);
    return () => clearInterval(t);
  }, [
    active?.id,
    active?.lastSampleAt,
    active?.lastValid,
    active?.source,
    data.clockOffset,
    userId,
  ]);
  if (!active) return null;
  const point = data.points.find((p) => p.id === active.pointId)!;
  return (
    <div className="presence-banner">
      <span className={`status-dot ${active.lastValid ? '' : 'paused'}`} />
      <Link to={`/?point=${point.id}`}>
        <strong>{active.lastValid ? 'Sua presença está contando' : 'Presença pausada'}</strong>
        <span>
          {point.name} · {formatHours(presenceDuration(active))} ·{' '}
          {active.source === 'demo' ? 'simulação' : 'GPS'}
        </span>
      </Link>
      {error && <span className="presence-error">{error}</span>}
      <button
        onClick={() =>
          void act(() => app.endPresence(userId), 'Presença encerrada. Seu tempo foi registrado.')
        }
      >
        <SignOutIcon size={17} />
        <span>Encerrar</span>
      </button>
    </div>
  );
}
export function DemoPanel() {
  const { data, userId } = useApp(),
    open = useUI((s) => s.demoOpen),
    toggle = useUI((s) => s.toggleDemo),
    [reset, setReset] = useState(false),
    [persona, setPersona] = useState(false),
    [tick, setTick] = useState(Date.now()),
    navigate = useNavigate();
  useEffect(() => {
    if (open) {
      const t = setInterval(() => setTick(Date.now()), 1000);
      return () => clearInterval(t);
    }
  }, [open]);
  if (!open) return null;
  const now = tick + data.clockOffset,
    active = data.presences.find((p) => p.userId === userId && !p.endedAt),
    next = data.events
      .filter((e) => e.end > now && isMember(data, userId, e.communityId))
      .sort((a, b) => a.start - b.start)[0];
  return (
    <>
      <aside className="demo-panel" aria-label="Painel de demonstração">
        <div className="demo-panel-heading">
          <FlaskIcon size={20} />
          <h2>Laboratório de encontros</h2>
          <IconButton label="Fechar demonstração" onClick={toggle}>
            <XIcon size={19} />
          </IconButton>
        </div>
        <p>Explore o ciclo completo, sem sair do PC.</p>
        <div className="demo-clock">
          <span>Relógio da demonstração</span>
          <strong>
            {new Intl.DateTimeFormat('pt-BR', {
              timeZone: 'America/Sao_Paulo',
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            }).format(now)}
          </strong>
        </div>
        <div className="demo-time-actions">
          {[10, 30, 60].map((m) => (
            <Button
              key={m}
              variant="secondary"
              onClick={() => void act(() => app.advance(m), `Relógio avançado em ${m} minutos.`)}
            >
              <PlayIcon size={13} />+{m} min
            </Button>
          ))}
        </div>
        {active ? (
          <div className="demo-session">
            <span className="meta">
              <MapPinIcon size={15} />
              {data.points.find((p) => p.id === active.pointId)?.name}
            </span>
            <strong>{formatHours(presenceDuration(active))} de presença registrada</strong>
            {active.source === 'demo' && (
              <div className="demo-geofence">
                <Button
                  variant={active.lastValid ? 'primary' : 'secondary'}
                  onClick={() =>
                    void act(
                      () => app.setDemoInside(userId, true),
                      'Posição simulada dentro da área.',
                    )
                  }
                >
                  <CheckCircleIcon size={16} />
                  Dentro do raio
                </Button>
                <Button
                  variant={!active.lastValid ? 'primary' : 'secondary'}
                  onClick={() =>
                    void act(
                      () => app.setDemoInside(userId, false),
                      'Fora da área. A presença está pausada.',
                    )
                  }
                >
                  <PauseCircleIcon size={16} />
                  Fora do raio
                </Button>
              </div>
            )}
            <Button
              className="full-width"
              variant="secondary"
              onClick={() => void act(() => app.endPresence(userId), 'Presença encerrada.')}
            >
              <SignOutIcon size={17} />
              Encerrar presença
            </Button>
          </div>
        ) : (
          <div className="demo-guide">
            <h3>Uma conquista em poucos passos</h3>
            <ol>
              <li>Abra um encontro e confirme o convite.</li>
              <li>Avance até o início e faça o check-in demonstrativo.</li>
              <li>Some os minutos necessários e avance até o fim.</li>
              <li>Encontre a insígnia nos troféus do perfil.</li>
            </ol>
            {next && (
              <Link className="text-link" to={`/eventos/${next.id}`}>
                Abrir encontro para testar
                <ArrowRightIcon size={15} />
              </Link>
            )}
          </div>
        )}
        <div className="demo-footer">
          <Button variant="ghost" onClick={() => setPersona(true)}>
            <UsersThreeIcon size={17} />
            Trocar perfil
          </Button>
          <button
            className="text-button"
            onClick={() =>
              void act(
                () => app.advance(Math.ceil((seasonBounds(seasonKey(now)).end - now) / MINUTE) + 1),
                'Uma nova temporada começou. O histórico foi preservado.',
              )
            }
          >
            Próxima temporada
          </button>
          <button className="text-button danger-text" onClick={() => setReset(true)}>
            Restaurar demonstração
          </button>
        </div>
        <p className="microcopy">
          Premium, dinheiro, pessoas e atividade são demonstrativos. Os dados ficam neste navegador.
        </p>
      </aside>
      {reset && (
        <Confirm
          title="Começar de novo?"
          description="Todas as alterações, imagens enviadas e conquistas locais serão substituídas pelo cenário inicial. Essa ação não pode ser desfeita."
          action="Restaurar demonstração"
          onConfirm={async () => {
            await resetDemo();
            useUI.getState().switchUser('u1');
            navigate('/');
            useUI.getState().notify('Cenário inicial restaurado.');
          }}
          onClose={() => setReset(false)}
        />
      )}{' '}
      {persona && <PersonaPicker onClose={() => setPersona(false)} />}
    </>
  );
}
