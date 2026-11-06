import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowUpRightIcon, ClockIcon, MapPinIcon, TrophyIcon } from '@phosphor-icons/react';
import {
  communityTotal,
  distributeRewards,
  formatHours,
  formatNumber,
  MINUTE,
  money,
  participants,
  seasonKey,
  territoryOwner,
} from '../domain/rules';
import { Avatar, Empty, PageHeading, Seal, useApp } from '../components/ui';

export default function SeasonPage() {
  const { data, now } = useApp(),
    [params] = useSearchParams(),
    [season, setSeason] = useState(seasonKey(now)),
    [communityId, setCommunityId] = useState(params.get('community') ?? 'c1');
  const seasons = [
      ...new Set([
        seasonKey(now),
        ...data.presences.flatMap((p) =>
          p.intervals.flatMap((i) => [seasonKey(i.start), seasonKey(i.end - 1)]),
        ),
      ]),
    ]
      .sort()
      .reverse(),
    ranking = data.communities
      .map((c) => ({ ...c, total: communityTotal(data, c, season) }))
      .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name)),
    rows = participants(data, communityId, season),
    rewards = distributeRewards(rows),
    total = rows.reduce((s, r) => s + r.duration, 0),
    selected = data.communities.find((c) => c.id === communityId)!;
  const seasonLabel = (key: string) =>
    new Intl.DateTimeFormat('pt-BR', {
      month: 'long',
      year: 'numeric',
      timeZone: 'America/Sao_Paulo',
    }).format(new Date(`${key}-15T12:00:00Z`));
  return (
    <div className="content-page season-page">
      <PageHeading
        title="O tempo juntos deixa uma marca."
        description="Cada minuto conta. Cada comunidade escreve sua história."
      >
        <label className="season-select">
          <span className="sr-only">Escolher temporada</span>
          <select value={season} onChange={(e) => setSeason(e.target.value)}>
            {seasons.map((s) => (
              <option key={s} value={s}>
                {seasonLabel(s)}
                {s === seasonKey(now) ? ' · em andamento' : ' · histórico'}
              </option>
            ))}
          </select>
        </label>
      </PageHeading>
      <div className="season-explainer">
        <TrophyIcon size={32} weight="thin" />
        <div>
          <h2>Uma nova disputa, todo mês.</h2>
          <p>
            Os territórios começam livres a cada temporada. Somamos o tempo de cada pessoa nos
            points. A comunidade com mais horas domina o lugar.
          </p>
        </div>
        <span>1 minuto = 1 ponto</span>
      </div>
      <div className="season-layout">
        <section className="ranking-section">
          <div className="section-heading">
            <h2>Comunidades em movimento</h2>
            <span className="meta">{seasonLabel(season)}</span>
          </div>
          <div className="ranking-table">
            <div className="ranking-table-head">
              <span>Comunidade</span>
              <span>Territórios</span>
              <span>Presença</span>
            </div>
            {ranking.map((c, index) => (
              <button
                key={c.id}
                className={`ranking-row ${communityId === c.id ? 'selected' : ''}`}
                onClick={() => setCommunityId(c.id)}
              >
                <span className="ranking-community">
                  <span className={`rank-number ${index === 0 ? 'first-rank' : ''}`}>
                    {index + 1}
                  </span>
                  <Seal community={c} size={40} />
                  <span>
                    <strong>{c.name}</strong>
                    <small>{formatNumber(Math.floor(c.total / MINUTE))} pontos</small>
                  </span>
                </span>
                <span>
                  {data.points.filter((p) => territoryOwner(data, p.id, season) === c.id).length}
                </span>
                <strong>{formatHours(c.total)}</strong>
              </button>
            ))}
          </div>
          <p className="form-help">
            A posição geral soma presença em todos os points. O domínio é calculado separadamente em
            cada local.
          </p>
        </section>
        <aside className="season-rewards">
          <div className="rewards-header">
            <Seal community={selected} size={48} />
            <div>
              <h2>{selected.name}</h2>
              <Link className="meta" to={`/comunidades/${selected.id}`}>
                Ver comunidade
                <ArrowUpRightIcon size={13} />
              </Link>
            </div>
          </div>
          <div className="reward-pool">
            <span>Fundo demonstrativo da temporada</span>
            <strong>
              R$ 1.000<span>,00</span>
            </strong>
            <small>Simulação · sem saldo ou transferência real</small>
          </div>
          <div className="reward-facts">
            <span>
              <ClockIcon size={17} />
              {formatHours(total)} juntos
            </span>
            <span>
              <MapPinIcon size={17} />
              {
                data.points.filter((p) => territoryOwner(data, p.id, season) === selected.id).length
              }{' '}
              territórios
            </span>
          </div>
          <h3>Quem faz acontecer</h3>
          {rows.length ? (
            rows.map((r, index) => {
              const u = data.users.find((u) => u.id === r.userId)!;
              return (
                <Link className="reward-person" to={`/perfil/${u.id}`} key={u.id}>
                  <span className="rank-number">{index + 1}</span>
                  <Avatar user={u} size={34} />
                  <span>
                    <strong>{u.name.split(' ')[0]}</strong>
                    <small>{formatHours(r.duration)}</small>
                  </span>
                  <strong>{money(rewards.find((a) => a.userId === u.id)?.cents ?? 0)}</strong>
                </Link>
              );
            })
          ) : (
            <Empty
              title="O primeiro minuto muda tudo"
              text="A distribuição aparece quando houver presença nesta temporada."
            />
          )}
          <p className="microcopy">
            Estimativa proporcional ao tempo de cada participante, incluindo contribuições
            históricas de ex-membros. O total distribuído é exatamente R$ 1.000 quando há presença.
            Não há pagamentos neste protótipo.
          </p>
        </aside>
      </div>
    </div>
  );
}
