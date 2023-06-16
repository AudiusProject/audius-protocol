import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { repostsCountOrderByAggregateInputObjectSchema } from './repostsCountOrderByAggregateInput.schema';
import { repostsAvgOrderByAggregateInputObjectSchema } from './repostsAvgOrderByAggregateInput.schema';
import { repostsMaxOrderByAggregateInputObjectSchema } from './repostsMaxOrderByAggregateInput.schema';
import { repostsMinOrderByAggregateInputObjectSchema } from './repostsMinOrderByAggregateInput.schema';
import { repostsSumOrderByAggregateInputObjectSchema } from './repostsSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.repostsOrderByWithAggregationInput> = z
  .object({
    blockhash: z.lazy(() => SortOrderSchema).optional(),
    blocknumber: z.lazy(() => SortOrderSchema).optional(),
    user_id: z.lazy(() => SortOrderSchema).optional(),
    repost_item_id: z.lazy(() => SortOrderSchema).optional(),
    repost_type: z.lazy(() => SortOrderSchema).optional(),
    is_current: z.lazy(() => SortOrderSchema).optional(),
    is_delete: z.lazy(() => SortOrderSchema).optional(),
    created_at: z.lazy(() => SortOrderSchema).optional(),
    txhash: z.lazy(() => SortOrderSchema).optional(),
    slot: z.lazy(() => SortOrderSchema).optional(),
    is_repost_of_repost: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => repostsCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z.lazy(() => repostsAvgOrderByAggregateInputObjectSchema).optional(),
    _max: z.lazy(() => repostsMaxOrderByAggregateInputObjectSchema).optional(),
    _min: z.lazy(() => repostsMinOrderByAggregateInputObjectSchema).optional(),
    _sum: z.lazy(() => repostsSumOrderByAggregateInputObjectSchema).optional(),
  })
  .strict();

export const repostsOrderByWithAggregationInputObjectSchema = Schema;
