import { z } from 'zod';

export const User_tipsScalarFieldEnumSchema = z.enum([
  'slot',
  'signature',
  'sender_user_id',
  'receiver_user_id',
  'amount',
  'created_at',
  'updated_at',
]);
