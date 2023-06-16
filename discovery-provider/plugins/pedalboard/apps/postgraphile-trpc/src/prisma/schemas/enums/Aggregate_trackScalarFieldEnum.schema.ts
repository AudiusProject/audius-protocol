import { z } from 'zod';

export const Aggregate_trackScalarFieldEnumSchema = z.enum([
  'track_id',
  'repost_count',
  'save_count',
]);
