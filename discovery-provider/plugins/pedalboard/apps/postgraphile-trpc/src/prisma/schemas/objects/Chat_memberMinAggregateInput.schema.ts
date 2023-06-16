import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Chat_memberMinAggregateInputType> = z
  .object({
    chat_id: z.literal(true).optional(),
    user_id: z.literal(true).optional(),
    cleared_history_at: z.literal(true).optional(),
    invited_by_user_id: z.literal(true).optional(),
    invite_code: z.literal(true).optional(),
    last_active_at: z.literal(true).optional(),
    unread_count: z.literal(true).optional(),
  })
  .strict();

export const Chat_memberMinAggregateInputObjectSchema = Schema;
