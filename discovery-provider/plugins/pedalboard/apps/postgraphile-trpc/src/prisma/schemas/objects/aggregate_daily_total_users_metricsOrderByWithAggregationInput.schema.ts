import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { aggregate_daily_total_users_metricsCountOrderByAggregateInputObjectSchema } from './aggregate_daily_total_users_metricsCountOrderByAggregateInput.schema';
import { aggregate_daily_total_users_metricsAvgOrderByAggregateInputObjectSchema } from './aggregate_daily_total_users_metricsAvgOrderByAggregateInput.schema';
import { aggregate_daily_total_users_metricsMaxOrderByAggregateInputObjectSchema } from './aggregate_daily_total_users_metricsMaxOrderByAggregateInput.schema';
import { aggregate_daily_total_users_metricsMinOrderByAggregateInputObjectSchema } from './aggregate_daily_total_users_metricsMinOrderByAggregateInput.schema';
import { aggregate_daily_total_users_metricsSumOrderByAggregateInputObjectSchema } from './aggregate_daily_total_users_metricsSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_daily_total_users_metricsOrderByWithAggregationInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      count: z.lazy(() => SortOrderSchema).optional(),
      timestamp: z.lazy(() => SortOrderSchema).optional(),
      created_at: z.lazy(() => SortOrderSchema).optional(),
      updated_at: z.lazy(() => SortOrderSchema).optional(),
      _count: z
        .lazy(
          () =>
            aggregate_daily_total_users_metricsCountOrderByAggregateInputObjectSchema,
        )
        .optional(),
      _avg: z
        .lazy(
          () =>
            aggregate_daily_total_users_metricsAvgOrderByAggregateInputObjectSchema,
        )
        .optional(),
      _max: z
        .lazy(
          () =>
            aggregate_daily_total_users_metricsMaxOrderByAggregateInputObjectSchema,
        )
        .optional(),
      _min: z
        .lazy(
          () =>
            aggregate_daily_total_users_metricsMinOrderByAggregateInputObjectSchema,
        )
        .optional(),
      _sum: z
        .lazy(
          () =>
            aggregate_daily_total_users_metricsSumOrderByAggregateInputObjectSchema,
        )
        .optional(),
    })
    .strict();

export const aggregate_daily_total_users_metricsOrderByWithAggregationInputObjectSchema =
  Schema;
