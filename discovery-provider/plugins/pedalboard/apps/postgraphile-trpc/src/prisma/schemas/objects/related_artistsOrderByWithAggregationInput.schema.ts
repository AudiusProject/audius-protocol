import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { related_artistsCountOrderByAggregateInputObjectSchema } from './related_artistsCountOrderByAggregateInput.schema';
import { related_artistsAvgOrderByAggregateInputObjectSchema } from './related_artistsAvgOrderByAggregateInput.schema';
import { related_artistsMaxOrderByAggregateInputObjectSchema } from './related_artistsMaxOrderByAggregateInput.schema';
import { related_artistsMinOrderByAggregateInputObjectSchema } from './related_artistsMinOrderByAggregateInput.schema';
import { related_artistsSumOrderByAggregateInputObjectSchema } from './related_artistsSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.related_artistsOrderByWithAggregationInput> = z
  .object({
    user_id: z.lazy(() => SortOrderSchema).optional(),
    related_artist_user_id: z.lazy(() => SortOrderSchema).optional(),
    score: z.lazy(() => SortOrderSchema).optional(),
    created_at: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => related_artistsCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z
      .lazy(() => related_artistsAvgOrderByAggregateInputObjectSchema)
      .optional(),
    _max: z
      .lazy(() => related_artistsMaxOrderByAggregateInputObjectSchema)
      .optional(),
    _min: z
      .lazy(() => related_artistsMinOrderByAggregateInputObjectSchema)
      .optional(),
    _sum: z
      .lazy(() => related_artistsSumOrderByAggregateInputObjectSchema)
      .optional(),
  })
  .strict();

export const related_artistsOrderByWithAggregationInputObjectSchema = Schema;
