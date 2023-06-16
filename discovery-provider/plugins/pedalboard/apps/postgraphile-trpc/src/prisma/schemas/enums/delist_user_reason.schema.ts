import { z } from 'zod';

export const delist_user_reasonSchema = z.enum([
  'STRIKE_THRESHOLD',
  'COPYRIGHT_SCHOOL',
  'MANUAL',
]);
