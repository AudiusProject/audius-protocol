import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Trending_resultsAvgAggregateInputType> = z
  .object({
    user_id: z.literal(true).optional(),
    rank: z.literal(true).optional(),
  })
  .strict();

export const Trending_resultsAvgAggregateInputObjectSchema = Schema;
