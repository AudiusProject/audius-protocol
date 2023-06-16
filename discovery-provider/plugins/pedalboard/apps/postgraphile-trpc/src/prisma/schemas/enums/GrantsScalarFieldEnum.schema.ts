import { z } from 'zod';

export const GrantsScalarFieldEnumSchema = z.enum([
  'blockhash',
  'blocknumber',
  'grantee_address',
  'user_id',
  'is_revoked',
  'is_current',
  'is_approved',
  'updated_at',
  'created_at',
  'txhash',
]);
