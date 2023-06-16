import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_monthly_app_name_metricsMaxOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      application_name: z.lazy(() => SortOrderSchema).optional(),
      count: z.lazy(() => SortOrderSchema).optional(),
      timestamp: z.lazy(() => SortOrderSchema).optional(),
      created_at: z.lazy(() => SortOrderSchema).optional(),
      updated_at: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const aggregate_monthly_app_name_metricsMaxOrderByAggregateInputObjectSchema =
  Schema;
