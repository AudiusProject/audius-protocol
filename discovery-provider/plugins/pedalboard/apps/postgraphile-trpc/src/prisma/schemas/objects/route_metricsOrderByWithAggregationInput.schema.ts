import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { route_metricsCountOrderByAggregateInputObjectSchema } from './route_metricsCountOrderByAggregateInput.schema';
import { route_metricsAvgOrderByAggregateInputObjectSchema } from './route_metricsAvgOrderByAggregateInput.schema';
import { route_metricsMaxOrderByAggregateInputObjectSchema } from './route_metricsMaxOrderByAggregateInput.schema';
import { route_metricsMinOrderByAggregateInputObjectSchema } from './route_metricsMinOrderByAggregateInput.schema';
import { route_metricsSumOrderByAggregateInputObjectSchema } from './route_metricsSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.route_metricsOrderByWithAggregationInput> = z
  .object({
    route_path: z.lazy(() => SortOrderSchema).optional(),
    version: z.lazy(() => SortOrderSchema).optional(),
    query_string: z.lazy(() => SortOrderSchema).optional(),
    count: z.lazy(() => SortOrderSchema).optional(),
    timestamp: z.lazy(() => SortOrderSchema).optional(),
    created_at: z.lazy(() => SortOrderSchema).optional(),
    updated_at: z.lazy(() => SortOrderSchema).optional(),
    id: z.lazy(() => SortOrderSchema).optional(),
    ip: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => route_metricsCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z
      .lazy(() => route_metricsAvgOrderByAggregateInputObjectSchema)
      .optional(),
    _max: z
      .lazy(() => route_metricsMaxOrderByAggregateInputObjectSchema)
      .optional(),
    _min: z
      .lazy(() => route_metricsMinOrderByAggregateInputObjectSchema)
      .optional(),
    _sum: z
      .lazy(() => route_metricsSumOrderByAggregateInputObjectSchema)
      .optional(),
  })
  .strict();

export const route_metricsOrderByWithAggregationInputObjectSchema = Schema;
