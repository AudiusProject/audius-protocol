import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Challenge_listen_streakMaxAggregateInputType> = z
  .object({
    user_id: z.literal(true).optional(),
    last_listen_date: z.literal(true).optional(),
    listen_streak: z.literal(true).optional(),
  })
  .strict();

export const Challenge_listen_streakMaxAggregateInputObjectSchema = Schema;
