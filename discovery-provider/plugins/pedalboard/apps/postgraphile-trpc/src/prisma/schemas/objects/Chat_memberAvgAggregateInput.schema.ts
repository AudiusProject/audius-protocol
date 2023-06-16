import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Chat_memberAvgAggregateInputType> = z
  .object({
    user_id: z.literal(true).optional(),
    invited_by_user_id: z.literal(true).optional(),
    unread_count: z.literal(true).optional(),
  })
  .strict();

export const Chat_memberAvgAggregateInputObjectSchema = Schema;
