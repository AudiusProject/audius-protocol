import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Challenge_listen_streakAvgAggregateInputType> = z
  .object({
    user_id: z.literal(true).optional(),
    listen_streak: z.literal(true).optional(),
  })
  .strict();

export const Challenge_listen_streakAvgAggregateInputObjectSchema = Schema;
