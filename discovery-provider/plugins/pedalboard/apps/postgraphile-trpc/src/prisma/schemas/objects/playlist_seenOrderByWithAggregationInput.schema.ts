import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { playlist_seenCountOrderByAggregateInputObjectSchema } from './playlist_seenCountOrderByAggregateInput.schema';
import { playlist_seenAvgOrderByAggregateInputObjectSchema } from './playlist_seenAvgOrderByAggregateInput.schema';
import { playlist_seenMaxOrderByAggregateInputObjectSchema } from './playlist_seenMaxOrderByAggregateInput.schema';
import { playlist_seenMinOrderByAggregateInputObjectSchema } from './playlist_seenMinOrderByAggregateInput.schema';
import { playlist_seenSumOrderByAggregateInputObjectSchema } from './playlist_seenSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.playlist_seenOrderByWithAggregationInput> = z
  .object({
    user_id: z.lazy(() => SortOrderSchema).optional(),
    playlist_id: z.lazy(() => SortOrderSchema).optional(),
    seen_at: z.lazy(() => SortOrderSchema).optional(),
    is_current: z.lazy(() => SortOrderSchema).optional(),
    blocknumber: z.lazy(() => SortOrderSchema).optional(),
    blockhash: z.lazy(() => SortOrderSchema).optional(),
    txhash: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => playlist_seenCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z
      .lazy(() => playlist_seenAvgOrderByAggregateInputObjectSchema)
      .optional(),
    _max: z
      .lazy(() => playlist_seenMaxOrderByAggregateInputObjectSchema)
      .optional(),
    _min: z
      .lazy(() => playlist_seenMinOrderByAggregateInputObjectSchema)
      .optional(),
    _sum: z
      .lazy(() => playlist_seenSumOrderByAggregateInputObjectSchema)
      .optional(),
  })
  .strict();

export const playlist_seenOrderByWithAggregationInputObjectSchema = Schema;
