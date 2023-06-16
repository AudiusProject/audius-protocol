import { z } from 'zod';

export const Chat_blocked_usersScalarFieldEnumSchema = z.enum([
  'blocker_user_id',
  'blockee_user_id',
  'created_at',
]);
