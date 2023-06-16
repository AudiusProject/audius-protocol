import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { user_challengesCountOrderByAggregateInputObjectSchema } from './user_challengesCountOrderByAggregateInput.schema';
import { user_challengesAvgOrderByAggregateInputObjectSchema } from './user_challengesAvgOrderByAggregateInput.schema';
import { user_challengesMaxOrderByAggregateInputObjectSchema } from './user_challengesMaxOrderByAggregateInput.schema';
import { user_challengesMinOrderByAggregateInputObjectSchema } from './user_challengesMinOrderByAggregateInput.schema';
import { user_challengesSumOrderByAggregateInputObjectSchema } from './user_challengesSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_challengesOrderByWithAggregationInput> = z
  .object({
    challenge_id: z.lazy(() => SortOrderSchema).optional(),
    user_id: z.lazy(() => SortOrderSchema).optional(),
    specifier: z.lazy(() => SortOrderSchema).optional(),
    is_complete: z.lazy(() => SortOrderSchema).optional(),
    current_step_count: z.lazy(() => SortOrderSchema).optional(),
    completed_blocknumber: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => user_challengesCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z
      .lazy(() => user_challengesAvgOrderByAggregateInputObjectSchema)
      .optional(),
    _max: z
      .lazy(() => user_challengesMaxOrderByAggregateInputObjectSchema)
      .optional(),
    _min: z
      .lazy(() => user_challengesMinOrderByAggregateInputObjectSchema)
      .optional(),
    _sum: z
      .lazy(() => user_challengesSumOrderByAggregateInputObjectSchema)
      .optional(),
  })
  .strict();

export const user_challengesOrderByWithAggregationInputObjectSchema = Schema;
