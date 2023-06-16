import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { track_trending_scoresCountOrderByAggregateInputObjectSchema } from './track_trending_scoresCountOrderByAggregateInput.schema';
import { track_trending_scoresAvgOrderByAggregateInputObjectSchema } from './track_trending_scoresAvgOrderByAggregateInput.schema';
import { track_trending_scoresMaxOrderByAggregateInputObjectSchema } from './track_trending_scoresMaxOrderByAggregateInput.schema';
import { track_trending_scoresMinOrderByAggregateInputObjectSchema } from './track_trending_scoresMinOrderByAggregateInput.schema';
import { track_trending_scoresSumOrderByAggregateInputObjectSchema } from './track_trending_scoresSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.track_trending_scoresOrderByWithAggregationInput> =
  z
    .object({
      track_id: z.lazy(() => SortOrderSchema).optional(),
      type: z.lazy(() => SortOrderSchema).optional(),
      genre: z.lazy(() => SortOrderSchema).optional(),
      version: z.lazy(() => SortOrderSchema).optional(),
      time_range: z.lazy(() => SortOrderSchema).optional(),
      score: z.lazy(() => SortOrderSchema).optional(),
      created_at: z.lazy(() => SortOrderSchema).optional(),
      _count: z
        .lazy(() => track_trending_scoresCountOrderByAggregateInputObjectSchema)
        .optional(),
      _avg: z
        .lazy(() => track_trending_scoresAvgOrderByAggregateInputObjectSchema)
        .optional(),
      _max: z
        .lazy(() => track_trending_scoresMaxOrderByAggregateInputObjectSchema)
        .optional(),
      _min: z
        .lazy(() => track_trending_scoresMinOrderByAggregateInputObjectSchema)
        .optional(),
      _sum: z
        .lazy(() => track_trending_scoresSumOrderByAggregateInputObjectSchema)
        .optional(),
    })
    .strict();

export const track_trending_scoresOrderByWithAggregationInputObjectSchema =
  Schema;
