import { z } from 'zod';

export const Playlist_seenScalarFieldEnumSchema = z.enum([
  'user_id',
  'playlist_id',
  'seen_at',
  'is_current',
  'blocknumber',
  'blockhash',
  'txhash',
]);
