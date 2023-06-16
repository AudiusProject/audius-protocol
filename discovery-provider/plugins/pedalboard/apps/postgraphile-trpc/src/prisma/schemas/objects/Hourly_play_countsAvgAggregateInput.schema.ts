import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Hourly_play_countsAvgAggregateInputType> = z
  .object({
    play_count: z.literal(true).optional(),
  })
  .strict();

export const Hourly_play_countsAvgAggregateInputObjectSchema = Schema;
