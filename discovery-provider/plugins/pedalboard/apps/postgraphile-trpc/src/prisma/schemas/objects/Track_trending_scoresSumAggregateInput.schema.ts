import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Track_trending_scoresSumAggregateInputType> = z
  .object({
    track_id: z.literal(true).optional(),
    score: z.literal(true).optional(),
  })
  .strict();

export const Track_trending_scoresSumAggregateInputObjectSchema = Schema;
