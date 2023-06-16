import { z } from 'zod';

export const RemixesScalarFieldEnumSchema = z.enum([
  'parent_track_id',
  'child_track_id',
]);
