import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_monthly_total_users_metricsAvgOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      count: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const aggregate_monthly_total_users_metricsAvgOrderByAggregateInputObjectSchema =
  Schema;
