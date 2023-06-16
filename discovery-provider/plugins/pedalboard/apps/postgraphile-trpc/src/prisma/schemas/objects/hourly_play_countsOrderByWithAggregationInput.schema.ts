import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { hourly_play_countsCountOrderByAggregateInputObjectSchema } from './hourly_play_countsCountOrderByAggregateInput.schema';
import { hourly_play_countsAvgOrderByAggregateInputObjectSchema } from './hourly_play_countsAvgOrderByAggregateInput.schema';
import { hourly_play_countsMaxOrderByAggregateInputObjectSchema } from './hourly_play_countsMaxOrderByAggregateInput.schema';
import { hourly_play_countsMinOrderByAggregateInputObjectSchema } from './hourly_play_countsMinOrderByAggregateInput.schema';
import { hourly_play_countsSumOrderByAggregateInputObjectSchema } from './hourly_play_countsSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.hourly_play_countsOrderByWithAggregationInput> =
  z
    .object({
      hourly_timestamp: z.lazy(() => SortOrderSchema).optional(),
      play_count: z.lazy(() => SortOrderSchema).optional(),
      _count: z
        .lazy(() => hourly_play_countsCountOrderByAggregateInputObjectSchema)
        .optional(),
      _avg: z
        .lazy(() => hourly_play_countsAvgOrderByAggregateInputObjectSchema)
        .optional(),
      _max: z
        .lazy(() => hourly_play_countsMaxOrderByAggregateInputObjectSchema)
        .optional(),
      _min: z
        .lazy(() => hourly_play_countsMinOrderByAggregateInputObjectSchema)
        .optional(),
      _sum: z
        .lazy(() => hourly_play_countsSumOrderByAggregateInputObjectSchema)
        .optional(),
    })
    .strict();

export const hourly_play_countsOrderByWithAggregationInputObjectSchema = Schema;
