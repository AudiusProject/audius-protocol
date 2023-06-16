import { z } from 'zod';

export const Notification_seenScalarFieldEnumSchema = z.enum([
  'user_id',
  'seen_at',
  'blocknumber',
  'blockhash',
  'txhash',
]);
