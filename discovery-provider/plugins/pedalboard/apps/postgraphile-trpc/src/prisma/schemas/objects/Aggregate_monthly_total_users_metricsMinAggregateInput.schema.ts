import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Aggregate_monthly_total_users_metricsMinAggregateInputType> =
  z
    .object({
      id: z.literal(true).optional(),
      count: z.literal(true).optional(),
      timestamp: z.literal(true).optional(),
      created_at: z.literal(true).optional(),
      updated_at: z.literal(true).optional(),
    })
    .strict();

export const Aggregate_monthly_total_users_metricsMinAggregateInputObjectSchema =
  Schema;
