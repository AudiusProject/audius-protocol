import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Track_trending_scoresMaxAggregateInputType> = z
  .object({
    track_id: z.literal(true).optional(),
    type: z.literal(true).optional(),
    genre: z.literal(true).optional(),
    version: z.literal(true).optional(),
    time_range: z.literal(true).optional(),
    score: z.literal(true).optional(),
    created_at: z.literal(true).optional(),
  })
  .strict();

export const Track_trending_scoresMaxAggregateInputObjectSchema = Schema;
