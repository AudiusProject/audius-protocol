import { z } from 'zod';

export const Skipped_transactionsScalarFieldEnumSchema = z.enum([
  'id',
  'blocknumber',
  'blockhash',
  'txhash',
  'created_at',
  'updated_at',
  'level',
]);
