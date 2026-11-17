import { Link } from 'react-router-dom';
import { ArrowRightIcon, CaretDownIcon } from '@phosphor-icons/react';
import { communityLevel, communityXpHistory, nextCommunityXp, XP_PER_LEVEL } from '../domain/play';
import { dateTime, isMember } from '../domain/rules';
import type { Community } from '../domain/types';
import { accessibleAccent } from '../lib/colors';
import { Seal, useApp } from './ui';

export function CommunityLevel({
  community,
  showName = false,
}: {
  community: Community;
  showName?: boolean;
}) {
  const { data, userId, now } = useApp();
  const { xp, level, progress } = communityLevel(data, userId, community.id);
  const next = nextCommunityXp(data, userId, community.id, now);
  const history = showName ? communityXpHistory(data, userId, community.id) : [];
  return (
    <div
      className="community-level"
      style={{ '--level-accent': accessibleAccent(community.color) } as React.CSSProperties}
    >
      <div className="level-seal">
        <Seal community={community} size={38} />
      </div>
      <div className="level-meter">
        {showName && (
          <Link className="level-community-name" to={`/comunidades/${community.id}`}>
            {community.name}
          </Link>
        )}
        <div>
          <strong>Nível {level}</strong>
          <span className="meta">{xp} XP no total</span>
        </div>
        <progress
          aria-label={`Progresso de nível em ${community.name}`}
          value={progress}
          max={XP_PER_LEVEL}
        />
        <span className="meta">
          Faltam {XP_PER_LEVEL - progress} XP para o nível {level + 1}
        </span>
        {next && (
          <Link className="text-link level-next" to={next.to}>
            {next.label}
            <ArrowRightIcon size={15} aria-hidden="true" />
          </Link>
        )}
        {!!history.length && (
          <details className="xp-history">
            <summary>
              Histórico de XP <CaretDownIcon size={14} aria-hidden="true" />
            </summary>
            <ol role="list">
              {history.map((entry) => (
                <li key={`${entry.kind}-${entry.id}`}>
                  <div>
                    <strong>{entry.title}</strong>
                    <small>
                      {entry.kind === 'path' ? 'Caminho concluído' : 'Insígnia'} ·{' '}
                      {dateTime(entry.date)}
                    </small>
                  </div>
                  <span>+{entry.xp} XP</span>
                </li>
              ))}
            </ol>
          </details>
        )}
      </div>
    </div>
  );
}

export function ProfileLevels() {
  const { data, userId } = useApp();
  const communities = data.communities.filter(
    (community) =>
      isMember(data, userId, community.id) || communityLevel(data, userId, community.id).xp > 0,
  );
  return (
    <section className="profile-levels">
      <h2>Meus níveis</h2>
      <p className="muted">
        {communities.length
          ? 'Ganhe 100 XP por insígnia e 200 XP por Caminho concluído.'
          : 'Entre em uma comunidade para começar a evoluir.'}
      </p>
      {communities.map((community) => (
        <CommunityLevel community={community} key={community.id} showName />
      ))}
    </section>
  );
}
