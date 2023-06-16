import { z } from 'zod';

export const User_eventsScalarFieldEnumSchema = z.enum([
  'id',
  'blockhash',
  'blocknumber',
  'is_current',
  'user_id',
  'referrer',
  'is_mobile_user',
  'slot',
]);
