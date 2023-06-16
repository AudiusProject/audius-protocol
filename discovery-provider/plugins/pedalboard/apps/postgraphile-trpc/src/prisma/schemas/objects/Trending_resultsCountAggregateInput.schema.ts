import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Trending_resultsCountAggregateInputType> = z
  .object({
    user_id: z.literal(true).optional(),
    id: z.literal(true).optional(),
    rank: z.literal(true).optional(),
    type: z.literal(true).optional(),
    version: z.literal(true).optional(),
    week: z.literal(true).optional(),
    _all: z.literal(true).optional(),
  })
  .strict();

export const Trending_resultsCountAggregateInputObjectSchema = Schema;
