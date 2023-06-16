import { z } from 'zod';

export const User_delist_statusesScalarFieldEnumSchema = z.enum([
  'created_at',
  'user_id',
  'delisted',
  'reason',
]);
