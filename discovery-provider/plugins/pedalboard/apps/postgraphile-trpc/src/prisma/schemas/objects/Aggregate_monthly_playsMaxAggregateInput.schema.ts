import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Aggregate_monthly_playsMaxAggregateInputType> = z
  .object({
    play_item_id: z.literal(true).optional(),
    timestamp: z.literal(true).optional(),
    count: z.literal(true).optional(),
  })
  .strict();

export const Aggregate_monthly_playsMaxAggregateInputObjectSchema = Schema;
