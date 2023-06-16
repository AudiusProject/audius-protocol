import { z } from 'zod';

export const Aggregate_user_tipsScalarFieldEnumSchema = z.enum([
  'sender_user_id',
  'receiver_user_id',
  'amount',
]);
