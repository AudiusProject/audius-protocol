import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Chat_blocked_usersSumAggregateInputType> = z
  .object({
    blocker_user_id: z.literal(true).optional(),
    blockee_user_id: z.literal(true).optional(),
  })
  .strict();

export const Chat_blocked_usersSumAggregateInputObjectSchema = Schema;
