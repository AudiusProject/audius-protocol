import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Aggregate_trackCountAggregateInputType> = z
  .object({
    track_id: z.literal(true).optional(),
    repost_count: z.literal(true).optional(),
    save_count: z.literal(true).optional(),
    _all: z.literal(true).optional(),
  })
  .strict();

export const Aggregate_trackCountAggregateInputObjectSchema = Schema;
