import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { user_delist_statusesCountOrderByAggregateInputObjectSchema } from './user_delist_statusesCountOrderByAggregateInput.schema';
import { user_delist_statusesAvgOrderByAggregateInputObjectSchema } from './user_delist_statusesAvgOrderByAggregateInput.schema';
import { user_delist_statusesMaxOrderByAggregateInputObjectSchema } from './user_delist_statusesMaxOrderByAggregateInput.schema';
import { user_delist_statusesMinOrderByAggregateInputObjectSchema } from './user_delist_statusesMinOrderByAggregateInput.schema';
import { user_delist_statusesSumOrderByAggregateInputObjectSchema } from './user_delist_statusesSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_delist_statusesOrderByWithAggregationInput> =
  z
    .object({
      created_at: z.lazy(() => SortOrderSchema).optional(),
      user_id: z.lazy(() => SortOrderSchema).optional(),
      delisted: z.lazy(() => SortOrderSchema).optional(),
      reason: z.lazy(() => SortOrderSchema).optional(),
      _count: z
        .lazy(() => user_delist_statusesCountOrderByAggregateInputObjectSchema)
        .optional(),
      _avg: z
        .lazy(() => user_delist_statusesAvgOrderByAggregateInputObjectSchema)
        .optional(),
      _max: z
        .lazy(() => user_delist_statusesMaxOrderByAggregateInputObjectSchema)
        .optional(),
      _min: z
        .lazy(() => user_delist_statusesMinOrderByAggregateInputObjectSchema)
        .optional(),
      _sum: z
        .lazy(() => user_delist_statusesSumOrderByAggregateInputObjectSchema)
        .optional(),
    })
    .strict();

export const user_delist_statusesOrderByWithAggregationInputObjectSchema =
  Schema;
