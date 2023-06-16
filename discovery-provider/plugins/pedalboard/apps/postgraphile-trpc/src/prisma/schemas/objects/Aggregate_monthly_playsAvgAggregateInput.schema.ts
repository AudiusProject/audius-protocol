import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Aggregate_monthly_playsAvgAggregateInputType> = z
  .object({
    play_item_id: z.literal(true).optional(),
    count: z.literal(true).optional(),
  })
  .strict();

export const Aggregate_monthly_playsAvgAggregateInputObjectSchema = Schema;
