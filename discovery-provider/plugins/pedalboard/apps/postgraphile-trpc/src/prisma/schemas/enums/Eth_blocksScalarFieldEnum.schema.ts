import { z } from 'zod';

export const Eth_blocksScalarFieldEnumSchema = z.enum([
  'last_scanned_block',
  'created_at',
  'updated_at',
]);
