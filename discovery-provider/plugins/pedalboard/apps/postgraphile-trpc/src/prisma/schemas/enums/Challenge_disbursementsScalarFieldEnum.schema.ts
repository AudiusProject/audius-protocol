import { z } from 'zod';

export const Challenge_disbursementsScalarFieldEnumSchema = z.enum([
  'challenge_id',
  'user_id',
  'specifier',
  'signature',
  'slot',
  'amount',
]);
