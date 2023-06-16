import { z } from 'zod';

export const StemsScalarFieldEnumSchema = z.enum([
  'parent_track_id',
  'child_track_id',
]);
