import { CharacterPortrait } from '../components/Character';
import { Avatar, Seal } from '../components/ui';
import type { Badge, Community, User } from '../domain/types';

export function GuildAvatar({ user, size }: { user: User; size: number }) {
  if (user.avatar) return <Avatar user={user} size={size} />;
  return (
    <div className="guild-avatar" style={{ width: size, height: size }}>
      <CharacterPortrait appearance={user.character} />
    </div>
  );
}
export function GuildMedal({ badge, community }: { badge: Badge; community: Community }) {
  return (
    <span className="guild-medal">
      <img src={badge.image} alt={'Insígnia ' + badge.title} />
      <Seal community={community} size={24} />
    </span>
  );
}
