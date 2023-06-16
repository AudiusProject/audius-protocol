import { z } from 'zod';

export const Chat_message_reactionsScalarFieldEnumSchema = z.enum([
  'user_id',
  'message_id',
  'reaction',
  'created_at',
  'updated_at',
]);
