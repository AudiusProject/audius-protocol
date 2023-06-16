import { z } from 'zod';

export const User_challengesScalarFieldEnumSchema = z.enum([
  'challenge_id',
  'user_id',
  'specifier',
  'is_complete',
  'current_step_count',
  'completed_blocknumber',
]);
