import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Aggregate_monthly_app_name_metricsSumAggregateInputType> =
  z
    .object({
      id: z.literal(true).optional(),
      count: z.literal(true).optional(),
    })
    .strict();

export const Aggregate_monthly_app_name_metricsSumAggregateInputObjectSchema =
  Schema;
