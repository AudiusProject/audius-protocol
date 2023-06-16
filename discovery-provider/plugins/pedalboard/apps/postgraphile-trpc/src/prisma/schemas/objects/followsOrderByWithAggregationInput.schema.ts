import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { followsCountOrderByAggregateInputObjectSchema } from './followsCountOrderByAggregateInput.schema';
import { followsAvgOrderByAggregateInputObjectSchema } from './followsAvgOrderByAggregateInput.schema';
import { followsMaxOrderByAggregateInputObjectSchema } from './followsMaxOrderByAggregateInput.schema';
import { followsMinOrderByAggregateInputObjectSchema } from './followsMinOrderByAggregateInput.schema';
import { followsSumOrderByAggregateInputObjectSchema } from './followsSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.followsOrderByWithAggregationInput> = z
  .object({
    blockhash: z.lazy(() => SortOrderSchema).optional(),
    blocknumber: z.lazy(() => SortOrderSchema).optional(),
    follower_user_id: z.lazy(() => SortOrderSchema).optional(),
    followee_user_id: z.lazy(() => SortOrderSchema).optional(),
    is_current: z.lazy(() => SortOrderSchema).optional(),
    is_delete: z.lazy(() => SortOrderSchema).optional(),
    created_at: z.lazy(() => SortOrderSchema).optional(),
    txhash: z.lazy(() => SortOrderSchema).optional(),
    slot: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => followsCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z.lazy(() => followsAvgOrderByAggregateInputObjectSchema).optional(),
    _max: z.lazy(() => followsMaxOrderByAggregateInputObjectSchema).optional(),
    _min: z.lazy(() => followsMinOrderByAggregateInputObjectSchema).optional(),
    _sum: z.lazy(() => followsSumOrderByAggregateInputObjectSchema).optional(),
  })
  .strict();

export const followsOrderByWithAggregationInputObjectSchema = Schema;
