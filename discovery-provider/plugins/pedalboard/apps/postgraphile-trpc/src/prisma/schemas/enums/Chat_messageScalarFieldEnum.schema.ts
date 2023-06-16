import { z } from 'zod';

export const Chat_messageScalarFieldEnumSchema = z.enum([
  'message_id',
  'chat_id',
  'user_id',
  'created_at',
  'ciphertext',
]);
