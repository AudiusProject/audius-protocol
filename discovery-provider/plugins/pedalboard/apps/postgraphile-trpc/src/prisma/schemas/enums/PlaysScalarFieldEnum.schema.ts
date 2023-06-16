import { z } from 'zod';

export const PlaysScalarFieldEnumSchema = z.enum([
  'id',
  'user_id',
  'source',
  'play_item_id',
  'created_at',
  'updated_at',
  'slot',
  'signature',
  'city',
  'region',
  'country',
]);
