import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Chat_blocked_usersMaxAggregateInputType> = z
  .object({
    blocker_user_id: z.literal(true).optional(),
    blockee_user_id: z.literal(true).optional(),
    created_at: z.literal(true).optional(),
  })
  .strict();

export const Chat_blocked_usersMaxAggregateInputObjectSchema = Schema;
