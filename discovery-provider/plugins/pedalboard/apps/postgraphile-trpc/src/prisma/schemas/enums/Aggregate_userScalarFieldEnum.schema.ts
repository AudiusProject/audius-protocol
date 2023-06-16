import { z } from 'zod';

export const Aggregate_userScalarFieldEnumSchema = z.enum([
  'user_id',
  'track_count',
  'playlist_count',
  'album_count',
  'follower_count',
  'following_count',
  'repost_count',
  'track_save_count',
  'supporter_count',
  'supporting_count',
]);
