import { z } from 'zod';

export const Associated_walletsScalarFieldEnumSchema = z.enum([
  'id',
  'user_id',
  'wallet',
  'blockhash',
  'blocknumber',
  'is_current',
  'is_delete',
  'chain',
]);
