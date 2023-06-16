import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { supporter_rank_upsCountOrderByAggregateInputObjectSchema } from './supporter_rank_upsCountOrderByAggregateInput.schema';
import { supporter_rank_upsAvgOrderByAggregateInputObjectSchema } from './supporter_rank_upsAvgOrderByAggregateInput.schema';
import { supporter_rank_upsMaxOrderByAggregateInputObjectSchema } from './supporter_rank_upsMaxOrderByAggregateInput.schema';
import { supporter_rank_upsMinOrderByAggregateInputObjectSchema } from './supporter_rank_upsMinOrderByAggregateInput.schema';
import { supporter_rank_upsSumOrderByAggregateInputObjectSchema } from './supporter_rank_upsSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.supporter_rank_upsOrderByWithAggregationInput> =
  z
    .object({
      slot: z.lazy(() => SortOrderSchema).optional(),
      sender_user_id: z.lazy(() => SortOrderSchema).optional(),
      receiver_user_id: z.lazy(() => SortOrderSchema).optional(),
      rank: z.lazy(() => SortOrderSchema).optional(),
      _count: z
        .lazy(() => supporter_rank_upsCountOrderByAggregateInputObjectSchema)
        .optional(),
      _avg: z
        .lazy(() => supporter_rank_upsAvgOrderByAggregateInputObjectSchema)
        .optional(),
      _max: z
        .lazy(() => supporter_rank_upsMaxOrderByAggregateInputObjectSchema)
        .optional(),
      _min: z
        .lazy(() => supporter_rank_upsMinOrderByAggregateInputObjectSchema)
        .optional(),
      _sum: z
        .lazy(() => supporter_rank_upsSumOrderByAggregateInputObjectSchema)
        .optional(),
    })
    .strict();

export const supporter_rank_upsOrderByWithAggregationInputObjectSchema = Schema;
