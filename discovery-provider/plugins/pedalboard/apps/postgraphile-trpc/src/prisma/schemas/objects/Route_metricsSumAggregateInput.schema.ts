import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Route_metricsSumAggregateInputType> = z
  .object({
    count: z.literal(true).optional(),
    id: z.literal(true).optional(),
  })
  .strict();

export const Route_metricsSumAggregateInputObjectSchema = Schema;
