import { z } from 'zod';

export const User_balance_changesScalarFieldEnumSchema = z.enum([
  'user_id',
  'blocknumber',
  'current_balance',
  'previous_balance',
  'created_at',
  'updated_at',
]);
