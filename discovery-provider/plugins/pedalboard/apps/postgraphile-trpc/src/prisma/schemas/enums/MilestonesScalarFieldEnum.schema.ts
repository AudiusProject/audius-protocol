import { z } from 'zod';

export const MilestonesScalarFieldEnumSchema = z.enum([
  'id',
  'name',
  'threshold',
  'blocknumber',
  'slot',
  'timestamp',
]);
