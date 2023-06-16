import { z } from 'zod';

export const Related_artistsScalarFieldEnumSchema = z.enum([
  'user_id',
  'related_artist_user_id',
  'score',
  'created_at',
]);
