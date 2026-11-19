import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrophyIcon, XIcon } from '@phosphor-icons/react';
import { isMember, seasonKey, territoryOwner } from '../domain/rules';
import { communityLevel } from '../domain/play';
import { IconButton, Media, Seal, useApp } from './ui';
import type { Community } from '../domain/types';

type Moment = {
  title: string;
  description: string;
  image?: string;
  community?: Community;
  level?: boolean;
  to: string;
};
export function ConquestMoment() {
  const { data, userId, now } = useApp(),
    season = seasonKey(now),
    [moment, setMoment] = useState<Moment>();
  const previous = useRef<
    | {
        userId: string;
        season: string;
        badges: Set<string>;
        levels: Record<string, number>;
        owners: Record<string, string | undefined>;
      }
    | undefined
  >(undefined);
  useEffect(() => {
    const badges = new Set(data.badges.filter((b) => b.userId === userId).map((b) => b.id)),
      owners = Object.fromEntries(
        data.points.map((p) => [p.id, territoryOwner(data, p.id, season)]),
      );
    const levels = Object.fromEntries(
      data.communities.map((community) => [
        community.id,
        communityLevel(data, userId, community.id).level,
      ]),
    );
    const before = previous.current;
    if (before?.userId === userId) {
      const badge = data.badges.find((b) => b.userId === userId && !before.badges.has(b.id));
      const leveled = data.communities.find(
        (community) => levels[community.id] > (before.levels[community.id] ?? 1),
      );
      if (leveled) {
        setMoment({
          title: `Nível ${levels[leveled.id]} em ${leveled.name}`,
          description: badge
            ? `Insígnia conquistada · ${badge.title}`
            : 'Novo nível pela conclusão de um Caminho.',
          community: leveled,
          level: true,
          to: '/perfil?tab=trofeus',
        });
      } else if (badge)
        setMoment({
          title: 'Este encontro agora é parte de você.',
          description: badge.title,
          image: badge.image,
          to: '/perfil?tab=trofeus',
        });
      else if (before.season === season) {
        const point = data.points.find(
          (p) =>
            owners[p.id] &&
            before.owners[p.id] !== owners[p.id] &&
            isMember(data, userId, owners[p.id]!),
        );
        if (point) {
          const community = data.communities.find((c) => c.id === owners[point.id])!;
          setMoment({
            title: 'Vocês conquistaram um lugar.',
            description: `${point.name} agora é território de ${community.name}.`,
            community,
            to: `/mapa?point=${point.id}`,
          });
        }
      }
    }
    previous.current = { userId, season, badges, owners, levels };
  }, [data, userId, season]);
  useEffect(() => {
    if (moment) {
      const t = setTimeout(() => setMoment(undefined), 9000);
      return () => clearTimeout(t);
    }
  }, [moment]);
  return moment ? (
    <div className={`conquest-moment${moment.level ? ' level-moment' : ''}`} role="status">
      {moment.image ? (
        <Media src={moment.image} alt="Sua nova insígnia" />
      ) : moment.community ? (
        <Seal community={moment.community} size={62} />
      ) : (
        <TrophyIcon size={36} />
      )}
      <div>
        <strong>{moment.title}</strong>
        <span>{moment.description}</span>
        <Link to={moment.to} onClick={() => setMoment(undefined)}>
          Ver conquista
        </Link>
      </div>
      <IconButton label="Fechar conquista" onClick={() => setMoment(undefined)}>
        <XIcon size={16} />
      </IconButton>
    </div>
  ) : null;
}
