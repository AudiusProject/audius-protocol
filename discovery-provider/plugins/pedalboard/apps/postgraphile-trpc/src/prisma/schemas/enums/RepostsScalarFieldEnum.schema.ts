import { z } from 'zod';

export const RepostsScalarFieldEnumSchema = z.enum([
  'blockhash',
  'blocknumber',
  'user_id',
  'repost_item_id',
  'repost_type',
  'is_current',
  'is_delete',
  'created_at',
  'txhash',
  'slot',
  'is_repost_of_repost',
]);
