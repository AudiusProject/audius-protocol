import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { app_name_metricsCountOrderByAggregateInputObjectSchema } from './app_name_metricsCountOrderByAggregateInput.schema';
import { app_name_metricsAvgOrderByAggregateInputObjectSchema } from './app_name_metricsAvgOrderByAggregateInput.schema';
import { app_name_metricsMaxOrderByAggregateInputObjectSchema } from './app_name_metricsMaxOrderByAggregateInput.schema';
import { app_name_metricsMinOrderByAggregateInputObjectSchema } from './app_name_metricsMinOrderByAggregateInput.schema';
import { app_name_metricsSumOrderByAggregateInputObjectSchema } from './app_name_metricsSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.app_name_metricsOrderByWithAggregationInput> = z
  .object({
    application_name: z.lazy(() => SortOrderSchema).optional(),
    count: z.lazy(() => SortOrderSchema).optional(),
    timestamp: z.lazy(() => SortOrderSchema).optional(),
    created_at: z.lazy(() => SortOrderSchema).optional(),
    updated_at: z.lazy(() => SortOrderSchema).optional(),
    id: z.lazy(() => SortOrderSchema).optional(),
    ip: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => app_name_metricsCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z
      .lazy(() => app_name_metricsAvgOrderByAggregateInputObjectSchema)
      .optional(),
    _max: z
      .lazy(() => app_name_metricsMaxOrderByAggregateInputObjectSchema)
      .optional(),
    _min: z
      .lazy(() => app_name_metricsMinOrderByAggregateInputObjectSchema)
      .optional(),
    _sum: z
      .lazy(() => app_name_metricsSumOrderByAggregateInputObjectSchema)
      .optional(),
  })
  .strict();

export const app_name_metricsOrderByWithAggregationInputObjectSchema = Schema;
