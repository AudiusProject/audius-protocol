import { z } from 'zod';

export const Supporter_rank_upsScalarFieldEnumSchema = z.enum([
  'slot',
  'sender_user_id',
  'receiver_user_id',
  'rank',
]);
