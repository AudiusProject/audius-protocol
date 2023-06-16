import { z } from 'zod';

export const Spl_token_txScalarFieldEnumSchema = z.enum([
  'last_scanned_slot',
  'signature',
  'created_at',
  'updated_at',
]);
