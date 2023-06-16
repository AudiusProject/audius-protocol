import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { aggregate_userCountOrderByAggregateInputObjectSchema } from './aggregate_userCountOrderByAggregateInput.schema';
import { aggregate_userAvgOrderByAggregateInputObjectSchema } from './aggregate_userAvgOrderByAggregateInput.schema';
import { aggregate_userMaxOrderByAggregateInputObjectSchema } from './aggregate_userMaxOrderByAggregateInput.schema';
import { aggregate_userMinOrderByAggregateInputObjectSchema } from './aggregate_userMinOrderByAggregateInput.schema';
import { aggregate_userSumOrderByAggregateInputObjectSchema } from './aggregate_userSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_userOrderByWithAggregationInput> = z
  .object({
    user_id: z.lazy(() => SortOrderSchema).optional(),
    track_count: z.lazy(() => SortOrderSchema).optional(),
    playlist_count: z.lazy(() => SortOrderSchema).optional(),
    album_count: z.lazy(() => SortOrderSchema).optional(),
    follower_count: z.lazy(() => SortOrderSchema).optional(),
    following_count: z.lazy(() => SortOrderSchema).optional(),
    repost_count: z.lazy(() => SortOrderSchema).optional(),
    track_save_count: z.lazy(() => SortOrderSchema).optional(),
    supporter_count: z.lazy(() => SortOrderSchema).optional(),
    supporting_count: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => aggregate_userCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z
      .lazy(() => aggregate_userAvgOrderByAggregateInputObjectSchema)
      .optional(),
    _max: z
      .lazy(() => aggregate_userMaxOrderByAggregateInputObjectSchema)
      .optional(),
    _min: z
      .lazy(() => aggregate_userMinOrderByAggregateInputObjectSchema)
      .optional(),
    _sum: z
      .lazy(() => aggregate_userSumOrderByAggregateInputObjectSchema)
      .optional(),
  })
  .strict();

export const aggregate_userOrderByWithAggregationInputObjectSchema = Schema;
