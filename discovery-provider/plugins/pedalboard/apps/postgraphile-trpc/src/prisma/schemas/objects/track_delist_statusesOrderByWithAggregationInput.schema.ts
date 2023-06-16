import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { track_delist_statusesCountOrderByAggregateInputObjectSchema } from './track_delist_statusesCountOrderByAggregateInput.schema';
import { track_delist_statusesAvgOrderByAggregateInputObjectSchema } from './track_delist_statusesAvgOrderByAggregateInput.schema';
import { track_delist_statusesMaxOrderByAggregateInputObjectSchema } from './track_delist_statusesMaxOrderByAggregateInput.schema';
import { track_delist_statusesMinOrderByAggregateInputObjectSchema } from './track_delist_statusesMinOrderByAggregateInput.schema';
import { track_delist_statusesSumOrderByAggregateInputObjectSchema } from './track_delist_statusesSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.track_delist_statusesOrderByWithAggregationInput> =
  z
    .object({
      created_at: z.lazy(() => SortOrderSchema).optional(),
      track_id: z.lazy(() => SortOrderSchema).optional(),
      owner_id: z.lazy(() => SortOrderSchema).optional(),
      track_cid: z.lazy(() => SortOrderSchema).optional(),
      delisted: z.lazy(() => SortOrderSchema).optional(),
      reason: z.lazy(() => SortOrderSchema).optional(),
      _count: z
        .lazy(() => track_delist_statusesCountOrderByAggregateInputObjectSchema)
        .optional(),
      _avg: z
        .lazy(() => track_delist_statusesAvgOrderByAggregateInputObjectSchema)
        .optional(),
      _max: z
        .lazy(() => track_delist_statusesMaxOrderByAggregateInputObjectSchema)
        .optional(),
      _min: z
        .lazy(() => track_delist_statusesMinOrderByAggregateInputObjectSchema)
        .optional(),
      _sum: z
        .lazy(() => track_delist_statusesSumOrderByAggregateInputObjectSchema)
        .optional(),
    })
    .strict();

export const track_delist_statusesOrderByWithAggregationInputObjectSchema =
  Schema;
