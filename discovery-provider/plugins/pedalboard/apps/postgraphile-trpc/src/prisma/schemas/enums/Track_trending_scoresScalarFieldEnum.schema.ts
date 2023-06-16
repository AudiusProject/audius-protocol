import { z } from 'zod';

export const Track_trending_scoresScalarFieldEnumSchema = z.enum([
  'track_id',
  'type',
  'genre',
  'version',
  'time_range',
  'score',
  'created_at',
]);
