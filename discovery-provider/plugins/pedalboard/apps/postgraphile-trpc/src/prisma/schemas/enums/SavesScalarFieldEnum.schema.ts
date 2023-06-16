import { z } from 'zod';

export const SavesScalarFieldEnumSchema = z.enum([
  'blockhash',
  'blocknumber',
  'user_id',
  'save_item_id',
  'save_type',
  'is_current',
  'is_delete',
  'created_at',
  'txhash',
  'slot',
  'is_save_of_repost',
]);
