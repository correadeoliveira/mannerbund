export type Id = string;
export type Emblem = 'sun' | 'mountain' | 'leaf' | 'flame' | 'waves' | 'aperture';
export interface User {
  id: Id;
  name: string;
  handle: string;
  bio: string;
  avatar?: string;
  color: string;
  premium: boolean;
}
export interface Community {
  id: Id;
  name: string;
  category: string;
  description: string;
  ownerId: Id;
  color: string;
  emblem: Emblem;
  cover: string;
  preset: string;
  createdAt: number;
}
export interface Membership {
  userId: Id;
  communityId: Id;
  joinedAt: number;
}
export interface Point {
  id: Id;
  name: string;
  neighborhood: string;
  lat: number;
  lng: number;
  radius: number;
}
export interface Event {
  id: Id;
  communityId: Id;
  pointId: Id;
  title: string;
  description: string;
  start: number;
  end: number;
  minimumMinutes: number;
  badgeTitle: string;
  badgeDescription: string;
  badgeImage: string;
  invitedIds: Id[];
  acceptedIds: Id[];
}
export interface Interval {
  start: number;
  end: number;
}
export interface Presence {
  id: Id;
  userId: Id;
  communityId: Id;
  pointId: Id;
  eventId?: Id;
  source: 'demo' | 'gps';
  startedAt: number;
  endedAt?: number;
  lastSampleAt: number;
  lastValid: boolean;
  intervals: Interval[];
}
export interface Badge {
  id: Id;
  userId: Id;
  eventId: Id;
  communityId: Id;
  communityName: string;
  eventTitle: string;
  title: string;
  description: string;
  image: string;
  date: number;
}
export interface Post {
  id: Id;
  userId: Id;
  communityId?: Id;
  text: string;
  image?: string;
  createdAt: number;
  likes: Id[];
  comments: { id: Id; userId: Id; text: string; createdAt: number }[];
}
export interface Conversation {
  id: Id;
  kind: 'channel' | 'dm';
  name: string;
  communityId?: Id;
  participantIds: Id[];
  createdAt: number;
}
export interface Message {
  id: Id;
  conversationId: Id;
  userId: Id;
  text: string;
  createdAt: number;
  deleted?: boolean;
}
export interface Follow {
  from: Id;
  to: Id;
}
export interface Ownership {
  pointId: Id;
  season: string;
  communityId: Id;
  changedAt: number;
}
export interface AppData {
  id: 'app';
  version: 1;
  users: User[];
  communities: Community[];
  memberships: Membership[];
  points: Point[];
  events: Event[];
  presences: Presence[];
  badges: Badge[];
  posts: Post[];
  conversations: Conversation[];
  messages: Message[];
  follows: Follow[];
  ownership: Ownership[];
  reads: Record<string, number>;
  clockOffset: number;
}
export interface Clock {
  now(): number;
}
export interface LocationSample {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}
export interface LocationProvider {
  watch(onSample: (sample: LocationSample) => void, onError: (message: string) => void): () => void;
}
