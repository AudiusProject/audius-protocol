import { z } from 'zod';

export const Developer_appsScalarFieldEnumSchema = z.enum([
  'address',
  'blockhash',
  'blocknumber',
  'user_id',
  'name',
  'is_personal_access',
  'is_delete',
  'created_at',
  'txhash',
  'is_current',
  'updated_at',
  'description',
]);
