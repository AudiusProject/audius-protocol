import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Aggregate_daily_total_users_metricsMaxAggregateInputType> =
  z
    .object({
      id: z.literal(true).optional(),
      count: z.literal(true).optional(),
      timestamp: z.literal(true).optional(),
      created_at: z.literal(true).optional(),
      updated_at: z.literal(true).optional(),
    })
    .strict();

export const Aggregate_daily_total_users_metricsMaxAggregateInputObjectSchema =
  Schema;
