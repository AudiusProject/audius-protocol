import { z } from 'zod';

export const Chat_memberScalarFieldEnumSchema = z.enum([
  'chat_id',
  'user_id',
  'cleared_history_at',
  'invited_by_user_id',
  'invite_code',
  'last_active_at',
  'unread_count',
]);
