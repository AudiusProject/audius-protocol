import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Trending_resultsSumAggregateInputType> = z
  .object({
    user_id: z.literal(true).optional(),
    rank: z.literal(true).optional(),
  })
  .strict();

export const Trending_resultsSumAggregateInputObjectSchema = Schema;
