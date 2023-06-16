import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { trending_resultsCountOrderByAggregateInputObjectSchema } from './trending_resultsCountOrderByAggregateInput.schema';
import { trending_resultsAvgOrderByAggregateInputObjectSchema } from './trending_resultsAvgOrderByAggregateInput.schema';
import { trending_resultsMaxOrderByAggregateInputObjectSchema } from './trending_resultsMaxOrderByAggregateInput.schema';
import { trending_resultsMinOrderByAggregateInputObjectSchema } from './trending_resultsMinOrderByAggregateInput.schema';
import { trending_resultsSumOrderByAggregateInputObjectSchema } from './trending_resultsSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.trending_resultsOrderByWithAggregationInput> = z
  .object({
    user_id: z.lazy(() => SortOrderSchema).optional(),
    id: z.lazy(() => SortOrderSchema).optional(),
    rank: z.lazy(() => SortOrderSchema).optional(),
    type: z.lazy(() => SortOrderSchema).optional(),
    version: z.lazy(() => SortOrderSchema).optional(),
    week: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => trending_resultsCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z
      .lazy(() => trending_resultsAvgOrderByAggregateInputObjectSchema)
      .optional(),
    _max: z
      .lazy(() => trending_resultsMaxOrderByAggregateInputObjectSchema)
      .optional(),
    _min: z
      .lazy(() => trending_resultsMinOrderByAggregateInputObjectSchema)
      .optional(),
    _sum: z
      .lazy(() => trending_resultsSumOrderByAggregateInputObjectSchema)
      .optional(),
  })
  .strict();

export const trending_resultsOrderByWithAggregationInputObjectSchema = Schema;
