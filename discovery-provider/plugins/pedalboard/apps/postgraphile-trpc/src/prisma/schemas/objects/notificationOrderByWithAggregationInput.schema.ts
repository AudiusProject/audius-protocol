import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { notificationCountOrderByAggregateInputObjectSchema } from './notificationCountOrderByAggregateInput.schema';
import { notificationAvgOrderByAggregateInputObjectSchema } from './notificationAvgOrderByAggregateInput.schema';
import { notificationMaxOrderByAggregateInputObjectSchema } from './notificationMaxOrderByAggregateInput.schema';
import { notificationMinOrderByAggregateInputObjectSchema } from './notificationMinOrderByAggregateInput.schema';
import { notificationSumOrderByAggregateInputObjectSchema } from './notificationSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.notificationOrderByWithAggregationInput> = z
  .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    specifier: z.lazy(() => SortOrderSchema).optional(),
    group_id: z.lazy(() => SortOrderSchema).optional(),
    type: z.lazy(() => SortOrderSchema).optional(),
    slot: z.lazy(() => SortOrderSchema).optional(),
    blocknumber: z.lazy(() => SortOrderSchema).optional(),
    timestamp: z.lazy(() => SortOrderSchema).optional(),
    data: z.lazy(() => SortOrderSchema).optional(),
    user_ids: z.lazy(() => SortOrderSchema).optional(),
    type_v2: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => notificationCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z
      .lazy(() => notificationAvgOrderByAggregateInputObjectSchema)
      .optional(),
    _max: z
      .lazy(() => notificationMaxOrderByAggregateInputObjectSchema)
      .optional(),
    _min: z
      .lazy(() => notificationMinOrderByAggregateInputObjectSchema)
      .optional(),
    _sum: z
      .lazy(() => notificationSumOrderByAggregateInputObjectSchema)
      .optional(),
  })
  .strict();

export const notificationOrderByWithAggregationInputObjectSchema = Schema;
