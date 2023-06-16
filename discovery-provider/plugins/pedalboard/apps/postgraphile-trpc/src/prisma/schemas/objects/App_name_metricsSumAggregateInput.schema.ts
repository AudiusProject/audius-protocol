import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.App_name_metricsSumAggregateInputType> = z
  .object({
    count: z.literal(true).optional(),
    id: z.literal(true).optional(),
  })
  .strict();

export const App_name_metricsSumAggregateInputObjectSchema = Schema;
