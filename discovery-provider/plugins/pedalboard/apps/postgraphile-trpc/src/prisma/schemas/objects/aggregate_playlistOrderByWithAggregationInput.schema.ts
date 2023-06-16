import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { aggregate_playlistCountOrderByAggregateInputObjectSchema } from './aggregate_playlistCountOrderByAggregateInput.schema';
import { aggregate_playlistAvgOrderByAggregateInputObjectSchema } from './aggregate_playlistAvgOrderByAggregateInput.schema';
import { aggregate_playlistMaxOrderByAggregateInputObjectSchema } from './aggregate_playlistMaxOrderByAggregateInput.schema';
import { aggregate_playlistMinOrderByAggregateInputObjectSchema } from './aggregate_playlistMinOrderByAggregateInput.schema';
import { aggregate_playlistSumOrderByAggregateInputObjectSchema } from './aggregate_playlistSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_playlistOrderByWithAggregationInput> =
  z
    .object({
      playlist_id: z.lazy(() => SortOrderSchema).optional(),
      is_album: z.lazy(() => SortOrderSchema).optional(),
      repost_count: z.lazy(() => SortOrderSchema).optional(),
      save_count: z.lazy(() => SortOrderSchema).optional(),
      _count: z
        .lazy(() => aggregate_playlistCountOrderByAggregateInputObjectSchema)
        .optional(),
      _avg: z
        .lazy(() => aggregate_playlistAvgOrderByAggregateInputObjectSchema)
        .optional(),
      _max: z
        .lazy(() => aggregate_playlistMaxOrderByAggregateInputObjectSchema)
        .optional(),
      _min: z
        .lazy(() => aggregate_playlistMinOrderByAggregateInputObjectSchema)
        .optional(),
      _sum: z
        .lazy(() => aggregate_playlistSumOrderByAggregateInputObjectSchema)
        .optional(),
    })
    .strict();

export const aggregate_playlistOrderByWithAggregationInputObjectSchema = Schema;
