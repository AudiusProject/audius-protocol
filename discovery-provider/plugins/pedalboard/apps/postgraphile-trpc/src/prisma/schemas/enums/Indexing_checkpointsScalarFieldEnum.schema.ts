import { z } from 'zod';

export const Indexing_checkpointsScalarFieldEnumSchema = z.enum([
  'tablename',
  'last_checkpoint',
  'signature',
]);
