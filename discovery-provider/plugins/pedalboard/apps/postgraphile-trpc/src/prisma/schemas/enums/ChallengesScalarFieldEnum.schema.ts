import { z } from 'zod';

export const ChallengesScalarFieldEnumSchema = z.enum([
  'id',
  'type',
  'amount',
  'active',
  'step_count',
  'starting_block',
]);
