import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRightIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PlusIcon,
  UsersThreeIcon,
} from '@phosphor-icons/react';
import { communityTotal, distanceMeters, formatHours, isMember, seasonKey } from '../domain/rules';
import { Button, Empty, Media, PageHeading, Seal, useApp } from '../components/ui';
import { categories, CommunityForm } from '../components/CommunityForm';
import { browserLocation } from '../services/location';
import { useUI } from '../state/ui';
import { accessibleAccent } from '../lib/colors';

export default function CommunitiesPage() {
  const { data, userId, now } = useApp(),
    [query, setQuery] = useState(''),
    [category, setCategory] = useState('Todas'),
    [mine, setMine] = useState(false),
    [create, setCreate] = useState(false),
    [origin, setOrigin] = useState({ lat: -23.565, lng: -46.67 }),
    [located, setLocated] = useState(false);
  const communities = useMemo(
    () =>
      data.communities
        .map((c) => {
          const pointIds = new Set([
            ...data.presences.filter((p) => p.communityId === c.id).map((p) => p.pointId),
            ...data.events.filter((e) => e.communityId === c.id).map((e) => e.pointId),
          ]);
          const distances = data.points
            .filter((p) => pointIds.has(p.id))
            .map((p) => distanceMeters(origin, p));
          return { ...c, distance: distances.length ? Math.min(...distances) : Infinity };
        })
        .filter(
          (c) =>
            `${c.name} ${c.description}`.toLowerCase().includes(query.toLowerCase()) &&
            (category === 'Todas' || c.category === category) &&
            (!mine || isMember(data, userId, c.id)),
        )
        .sort((a, b) => a.distance - b.distance),
    [data, query, category, mine, userId, origin],
  );
  const locate = () => {
    let stop = () => {};
    stop = browserLocation.watch(
      (sample) => {
        setOrigin(sample);
        setLocated(true);
        stop();
      },
      (error) => {
        useUI.getState().notify(error, true);
        stop();
      },
    );
  };
  return (
    <div className="content-page">
      <PageHeading
        title="Sua próxima comunidade está perto."
        description="Gente que compartilha o que faz você se sentir vivo."
      >
        <Button onClick={() => setCreate(true)}>
          <PlusIcon size={18} />
          Criar comunidade
        </Button>
      </PageHeading>
      <div className="discovery-toolbar">
        <label className="search-field">
          <MagnifyingGlassIcon size={19} />
          <input
            aria-label="Buscar comunidades"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Encontre sua turma"
          />
        </label>
        <select
          aria-label="Categoria"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option>Todas</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <button
          className={`filter-button ${mine ? 'active' : ''}`}
          aria-pressed={mine}
          onClick={() => setMine(!mine)}
        >
          Minhas comunidades
        </button>
        <Button variant="ghost" onClick={locate}>
          <MapPinIcon size={17} />
          {located ? 'Perto de mim' : 'Usar minha localização'}
        </Button>
      </div>
      <div className="results-caption">
        <span>{communities.length} comunidades para descobrir</span>
        <span>
          {located
            ? 'Distâncias da sua localização'
            : 'Distâncias a partir do centro do cenário em São Paulo'}
        </span>
      </div>
      {communities.length ? (
        <div className="community-grid">
          {communities.map((c) => (
            <Link to={`/comunidades/${c.id}`} className="community-card" key={c.id}>
              <div className="community-cover-wrap">
                <Media
                  src={c.cover}
                  className="community-cover"
                  alt={`Capa ilustrativa de ${c.name}`}
                />
                {isMember(data, userId, c.id) && (
                  <span className="member-label">Você faz parte</span>
                )}
              </div>
              <div className="community-card-content">
                <div className="community-card-top">
                  <Seal community={c} size={48} />
                  <ArrowUpRightIcon size={20} />
                </div>
                <span className="meta category-label">{c.category}</span>
                <h2>{c.name}</h2>
                <p>{c.description}</p>
                <div className="community-card-footer">
                  <span>
                    <UsersThreeIcon size={16} />
                    {data.memberships.filter((m) => m.communityId === c.id).length} membros
                  </span>
                  <span>
                    <MapPinIcon size={15} />
                    {Number.isFinite(c.distance)
                      ? `${(c.distance / 1000).toFixed(1).replace('.', ',')} km`
                      : 'Novo lugar'}
                  </span>
                </div>
                <div className="community-hours">
                  <span className="color-dot" style={{ background: accessibleAccent(c.color) }} />
                  {formatHours(communityTotal(data, c, seasonKey(now)))} de histórias neste mês
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <Empty
          title="Sua turma pode estar começando agora"
          text="Tente outra busca ou crie a comunidade que você gostaria de encontrar."
          action={<Button onClick={() => setCreate(true)}>Criar comunidade</Button>}
        />
      )}
      <p className="page-footnote">
        Comunidades e atividade ilustrativas para explorar o protótipo.
      </p>
      {create && <CommunityForm onClose={() => setCreate(false)} />}
    </div>
  );
}
