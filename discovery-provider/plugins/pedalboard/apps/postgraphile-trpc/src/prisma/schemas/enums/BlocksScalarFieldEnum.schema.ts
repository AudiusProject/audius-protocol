import { z } from 'zod';

export const BlocksScalarFieldEnumSchema = z.enum([
  'blockhash',
  'parenthash',
  'is_current',
  'number',
]);
