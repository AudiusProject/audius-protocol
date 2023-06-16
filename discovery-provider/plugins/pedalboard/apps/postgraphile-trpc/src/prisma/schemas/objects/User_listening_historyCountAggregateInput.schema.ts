import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.User_listening_historyCountAggregateInputType> =
  z
    .object({
      user_id: z.literal(true).optional(),
      listening_history: z.literal(true).optional(),
      _all: z.literal(true).optional(),
    })
    .strict();

export const User_listening_historyCountAggregateInputObjectSchema = Schema;
