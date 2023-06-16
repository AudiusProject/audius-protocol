import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { challengesCountOrderByAggregateInputObjectSchema } from './challengesCountOrderByAggregateInput.schema';
import { challengesAvgOrderByAggregateInputObjectSchema } from './challengesAvgOrderByAggregateInput.schema';
import { challengesMaxOrderByAggregateInputObjectSchema } from './challengesMaxOrderByAggregateInput.schema';
import { challengesMinOrderByAggregateInputObjectSchema } from './challengesMinOrderByAggregateInput.schema';
import { challengesSumOrderByAggregateInputObjectSchema } from './challengesSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.challengesOrderByWithAggregationInput> = z
  .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    type: z.lazy(() => SortOrderSchema).optional(),
    amount: z.lazy(() => SortOrderSchema).optional(),
    active: z.lazy(() => SortOrderSchema).optional(),
    step_count: z.lazy(() => SortOrderSchema).optional(),
    starting_block: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => challengesCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z
      .lazy(() => challengesAvgOrderByAggregateInputObjectSchema)
      .optional(),
    _max: z
      .lazy(() => challengesMaxOrderByAggregateInputObjectSchema)
      .optional(),
    _min: z
      .lazy(() => challengesMinOrderByAggregateInputObjectSchema)
      .optional(),
    _sum: z
      .lazy(() => challengesSumOrderByAggregateInputObjectSchema)
      .optional(),
  })
  .strict();

export const challengesOrderByWithAggregationInputObjectSchema = Schema;
