import { z } from 'zod';

export const Track_delist_statusesScalarFieldEnumSchema = z.enum([
  'created_at',
  'track_id',
  'owner_id',
  'track_cid',
  'delisted',
  'reason',
]);
