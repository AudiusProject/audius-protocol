import { z } from 'zod';

export const FollowsScalarFieldEnumSchema = z.enum([
  'blockhash',
  'blocknumber',
  'follower_user_id',
  'followee_user_id',
  'is_current',
  'is_delete',
  'created_at',
  'txhash',
  'slot',
]);
