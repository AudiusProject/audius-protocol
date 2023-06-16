import { z } from 'zod';

export const Challenge_listen_streakScalarFieldEnumSchema = z.enum([
  'user_id',
  'last_listen_date',
  'listen_streak',
]);
