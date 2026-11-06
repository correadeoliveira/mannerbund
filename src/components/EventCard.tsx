import { CalendarBlankIcon, MapPinIcon, ArrowUpRightIcon } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import type { Event } from '../domain/types';
import { timeOnly } from '../domain/rules';
import { Seal, useApp } from './ui';
export function EventCard({ event, compact = false }: { event: Event; compact?: boolean }) {
  const { data, now } = useApp(),
    community = data.communities.find((c) => c.id === event.communityId)!,
    point = data.points.find((p) => p.id === event.pointId)!;
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: 'short',
  }).formatToParts(event.start);
  return (
    <Link to={`/eventos/${event.id}`} className={`event-card ${compact ? 'event-compact' : ''}`}>
      <div className="event-date">
        <span>{parts.find((p) => p.type === 'day')?.value}</span>
        <small>{parts.find((p) => p.type === 'month')?.value.replace('.', '')}</small>
      </div>
      <div className="event-info">
        <span className="event-community">
          <Seal community={community} size={20} />
          {community.name}
          {event.start <= now && event.end > now && <span className="live-dot" />}
        </span>
        <h3>{event.title}</h3>
        <span className="meta">
          <MapPinIcon size={13} />
          {point.name}
        </span>
        {!compact && (
          <span className="meta">
            <CalendarBlankIcon size={13} />
            {timeOnly(event.start)} às {timeOnly(event.end)} · {event.acceptedIds.length}{' '}
            confirmados
          </span>
        )}
      </div>
      <ArrowUpRightIcon size={18} className="event-arrow" />
    </Link>
  );
}
