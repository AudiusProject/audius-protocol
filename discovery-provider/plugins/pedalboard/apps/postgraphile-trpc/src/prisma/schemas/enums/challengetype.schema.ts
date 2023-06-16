import { z } from 'zod';

export const challengetypeSchema = z.enum([
  'boolean',
  'numeric',
  'aggregate',
  'trending',
]);
