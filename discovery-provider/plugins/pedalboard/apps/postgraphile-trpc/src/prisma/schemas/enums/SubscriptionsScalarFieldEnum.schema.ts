import { z } from 'zod';

export const SubscriptionsScalarFieldEnumSchema = z.enum([
  'blockhash',
  'blocknumber',
  'subscriber_id',
  'user_id',
  'is_current',
  'is_delete',
  'created_at',
  'txhash',
]);
