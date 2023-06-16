import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { aggregate_monthly_app_name_metricsCountOrderByAggregateInputObjectSchema } from './aggregate_monthly_app_name_metricsCountOrderByAggregateInput.schema';
import { aggregate_monthly_app_name_metricsAvgOrderByAggregateInputObjectSchema } from './aggregate_monthly_app_name_metricsAvgOrderByAggregateInput.schema';
import { aggregate_monthly_app_name_metricsMaxOrderByAggregateInputObjectSchema } from './aggregate_monthly_app_name_metricsMaxOrderByAggregateInput.schema';
import { aggregate_monthly_app_name_metricsMinOrderByAggregateInputObjectSchema } from './aggregate_monthly_app_name_metricsMinOrderByAggregateInput.schema';
import { aggregate_monthly_app_name_metricsSumOrderByAggregateInputObjectSchema } from './aggregate_monthly_app_name_metricsSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_monthly_app_name_metricsOrderByWithAggregationInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      application_name: z.lazy(() => SortOrderSchema).optional(),
      count: z.lazy(() => SortOrderSchema).optional(),
      timestamp: z.lazy(() => SortOrderSchema).optional(),
      created_at: z.lazy(() => SortOrderSchema).optional(),
      updated_at: z.lazy(() => SortOrderSchema).optional(),
      _count: z
        .lazy(
          () =>
            aggregate_monthly_app_name_metricsCountOrderByAggregateInputObjectSchema,
        )
        .optional(),
      _avg: z
        .lazy(
          () =>
            aggregate_monthly_app_name_metricsAvgOrderByAggregateInputObjectSchema,
        )
        .optional(),
      _max: z
        .lazy(
          () =>
            aggregate_monthly_app_name_metricsMaxOrderByAggregateInputObjectSchema,
        )
        .optional(),
      _min: z
        .lazy(
          () =>
            aggregate_monthly_app_name_metricsMinOrderByAggregateInputObjectSchema,
        )
        .optional(),
      _sum: z
        .lazy(
          () =>
            aggregate_monthly_app_name_metricsSumOrderByAggregateInputObjectSchema,
        )
        .optional(),
    })
    .strict();

export const aggregate_monthly_app_name_metricsOrderByWithAggregationInputObjectSchema =
  Schema;
