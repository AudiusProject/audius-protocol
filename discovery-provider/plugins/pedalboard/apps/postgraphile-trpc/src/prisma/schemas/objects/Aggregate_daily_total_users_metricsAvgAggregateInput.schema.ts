import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Aggregate_daily_total_users_metricsAvgAggregateInputType> =
  z
    .object({
      id: z.literal(true).optional(),
      count: z.literal(true).optional(),
    })
    .strict();

export const Aggregate_daily_total_users_metricsAvgAggregateInputObjectSchema =
  Schema;
