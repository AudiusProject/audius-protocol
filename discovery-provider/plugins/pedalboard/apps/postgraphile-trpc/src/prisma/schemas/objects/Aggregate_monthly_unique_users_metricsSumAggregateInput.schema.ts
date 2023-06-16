import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Aggregate_monthly_unique_users_metricsSumAggregateInputType> =
  z
    .object({
      id: z.literal(true).optional(),
      count: z.literal(true).optional(),
      summed_count: z.literal(true).optional(),
    })
    .strict();

export const Aggregate_monthly_unique_users_metricsSumAggregateInputObjectSchema =
  Schema;
