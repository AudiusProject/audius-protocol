import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Aggregate_trackSumAggregateInputType> = z
  .object({
    track_id: z.literal(true).optional(),
    repost_count: z.literal(true).optional(),
    save_count: z.literal(true).optional(),
  })
  .strict();

export const Aggregate_trackSumAggregateInputObjectSchema = Schema;
