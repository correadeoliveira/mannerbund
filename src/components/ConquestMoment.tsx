import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrophyIcon, XIcon } from '@phosphor-icons/react';
import { isMember, seasonKey, territoryOwner } from '../domain/rules';
import { IconButton, Media, Seal, useApp } from './ui';
import type { Community } from '../domain/types';

type Moment = {
  title: string;
  description: string;
  image?: string;
  community?: Community;
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
        owners: Record<string, string | undefined>;
      }
    | undefined
  >(undefined);
  useEffect(() => {
    const badges = new Set(data.badges.filter((b) => b.userId === userId).map((b) => b.id)),
      owners = Object.fromEntries(
        data.points.map((p) => [p.id, territoryOwner(data, p.id, season)]),
      );
    const before = previous.current;
    if (before?.userId === userId) {
      const badge = data.badges.find((b) => b.userId === userId && !before.badges.has(b.id));
      if (badge)
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
            to: `/?point=${point.id}`,
          });
        }
      }
    }
    previous.current = { userId, season, badges, owners };
  }, [data, userId, season]);
  useEffect(() => {
    if (moment) {
      const t = setTimeout(() => setMoment(undefined), 9000);
      return () => clearTimeout(t);
    }
  }, [moment]);
  return moment ? (
    <div className="conquest-moment" role="status">
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
