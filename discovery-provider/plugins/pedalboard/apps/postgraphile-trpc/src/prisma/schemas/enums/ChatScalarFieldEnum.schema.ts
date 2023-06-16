import { z } from 'zod';

export const ChatScalarFieldEnumSchema = z.enum([
  'chat_id',
  'created_at',
  'last_message_at',
  'last_message',
]);
