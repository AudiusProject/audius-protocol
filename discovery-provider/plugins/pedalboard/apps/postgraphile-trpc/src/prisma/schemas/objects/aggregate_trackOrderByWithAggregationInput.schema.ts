import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { aggregate_trackCountOrderByAggregateInputObjectSchema } from './aggregate_trackCountOrderByAggregateInput.schema';
import { aggregate_trackAvgOrderByAggregateInputObjectSchema } from './aggregate_trackAvgOrderByAggregateInput.schema';
import { aggregate_trackMaxOrderByAggregateInputObjectSchema } from './aggregate_trackMaxOrderByAggregateInput.schema';
import { aggregate_trackMinOrderByAggregateInputObjectSchema } from './aggregate_trackMinOrderByAggregateInput.schema';
import { aggregate_trackSumOrderByAggregateInputObjectSchema } from './aggregate_trackSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_trackOrderByWithAggregationInput> = z
  .object({
    track_id: z.lazy(() => SortOrderSchema).optional(),
    repost_count: z.lazy(() => SortOrderSchema).optional(),
    save_count: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => aggregate_trackCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z
      .lazy(() => aggregate_trackAvgOrderByAggregateInputObjectSchema)
      .optional(),
    _max: z
      .lazy(() => aggregate_trackMaxOrderByAggregateInputObjectSchema)
      .optional(),
    _min: z
      .lazy(() => aggregate_trackMinOrderByAggregateInputObjectSchema)
      .optional(),
    _sum: z
      .lazy(() => aggregate_trackSumOrderByAggregateInputObjectSchema)
      .optional(),
  })
  .strict();

export const aggregate_trackOrderByWithAggregationInputObjectSchema = Schema;
