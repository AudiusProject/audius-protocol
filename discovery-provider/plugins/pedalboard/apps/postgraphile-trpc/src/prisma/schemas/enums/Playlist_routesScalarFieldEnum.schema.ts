import { z } from 'zod';

export const Playlist_routesScalarFieldEnumSchema = z.enum([
  'slug',
  'title_slug',
  'collision_id',
  'owner_id',
  'playlist_id',
  'is_current',
  'blockhash',
  'blocknumber',
  'txhash',
]);
