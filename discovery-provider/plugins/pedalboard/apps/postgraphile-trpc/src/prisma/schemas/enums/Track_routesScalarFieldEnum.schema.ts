import { z } from 'zod';

export const Track_routesScalarFieldEnumSchema = z.enum([
  'slug',
  'title_slug',
  'collision_id',
  'owner_id',
  'track_id',
  'is_current',
  'blockhash',
  'blocknumber',
  'txhash',
]);
