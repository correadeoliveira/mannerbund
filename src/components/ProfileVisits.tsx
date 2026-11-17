import { ArrowRightIcon, MapPinIcon } from '@phosphor-icons/react';
import { Link, useSearchParams } from 'react-router-dom';
import { dateTime, formatHours, MINUTE, visitsByMonth } from '../domain/rules';
import { Button, Empty, useApp } from './ui';

const monthLabel = new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  year: 'numeric',
  timeZone: 'America/Sao_Paulo',
});

export function ProfileVisits() {
  const { data, userId } = useApp();
  const [params, setParams] = useSearchParams();
  const source = params.get('origem') === 'demo' ? 'demo' : 'gps';
  const setSource = (next: 'gps' | 'demo') =>
    setParams(next === 'demo' ? { tab: 'lugares', origem: 'demo' } : { tab: 'lugares' }, {
      replace: true,
    });
  const months = visitsByMonth(data, userId, source);

  return (
    <section className="visit-history" aria-labelledby="visit-heading">
      <div className="visit-heading">
        <h2 id="visit-heading">Lugares visitados</h2>
        <label>
          Origem
          <select
            value={source}
            onChange={(event) => setSource(event.target.value === 'demo' ? 'demo' : 'gps')}
          >
            <option value="gps">GPS</option>
            <option value="demo">Demonstração</option>
          </select>
        </label>
      </div>
      {months.size === 0 ? (
        <Empty
          title={source === 'gps' ? 'Nenhuma visita por GPS' : 'Nenhuma visita demonstrativa'}
          text="Seus check-ins concluídos aparecem aqui após registrar tempo válido no local."
          action={
            <div className="visit-empty-actions">
              <Link className="button button-primary" to="/">
                Explorar o mapa
              </Link>
              {source === 'gps' && (
                <Button variant="secondary" onClick={() => setSource('demo')}>
                  Ver demonstração
                </Button>
              )}
            </div>
          }
        />
      ) : (
        [...months].map(([month, visits]) => (
          <section className="visit-month" key={month}>
            <h3>{monthLabel.format(visits[0].presence.startedAt)}</h3>
            <ul role="list">
              {visits.map(({ presence, duration, event }) => {
                const point = data.points.find((item) => item.id === presence.pointId);
                const community = data.communities.find((item) => item.id === presence.communityId);
                return (
                  <li className="visit-row" key={presence.id}>
                    <MapPinIcon className="visit-pin" size={19} aria-hidden="true" />
                    <div className="visit-info">
                      <h4>{point?.name ?? 'Local indisponível'}</h4>
                      <p className="meta">
                        {point?.neighborhood && <>{point.neighborhood} · </>}
                        <time dateTime={new Date(presence.startedAt).toISOString()}>
                          {dateTime(presence.startedAt)}
                        </time>
                      </p>
                      <p className="meta">
                        {community?.name ?? 'Comunidade indisponível'} ·{' '}
                        {event?.title ?? (presence.eventId ? 'Encontro' : 'Visita livre')}
                      </p>
                    </div>
                    <div className="visit-row-actions">
                      <strong>
                        {duration < MINUTE ? 'Menos de 1 min' : formatHours(duration)}
                      </strong>
                      {point && (
                        <Link
                          className="button button-secondary"
                          to={`/?point=${encodeURIComponent(point.id)}`}
                          aria-label={`Ver no mapa: ${point.name}`}
                        >
                          Ver no mapa <ArrowRightIcon size={15} aria-hidden="true" />
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </section>
  );
}
