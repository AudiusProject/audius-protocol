import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { notification_seenCountOrderByAggregateInputObjectSchema } from './notification_seenCountOrderByAggregateInput.schema';
import { notification_seenAvgOrderByAggregateInputObjectSchema } from './notification_seenAvgOrderByAggregateInput.schema';
import { notification_seenMaxOrderByAggregateInputObjectSchema } from './notification_seenMaxOrderByAggregateInput.schema';
import { notification_seenMinOrderByAggregateInputObjectSchema } from './notification_seenMinOrderByAggregateInput.schema';
import { notification_seenSumOrderByAggregateInputObjectSchema } from './notification_seenSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.notification_seenOrderByWithAggregationInput> = z
  .object({
    user_id: z.lazy(() => SortOrderSchema).optional(),
    seen_at: z.lazy(() => SortOrderSchema).optional(),
    blocknumber: z.lazy(() => SortOrderSchema).optional(),
    blockhash: z.lazy(() => SortOrderSchema).optional(),
    txhash: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => notification_seenCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z
      .lazy(() => notification_seenAvgOrderByAggregateInputObjectSchema)
      .optional(),
    _max: z
      .lazy(() => notification_seenMaxOrderByAggregateInputObjectSchema)
      .optional(),
    _min: z
      .lazy(() => notification_seenMinOrderByAggregateInputObjectSchema)
      .optional(),
    _sum: z
      .lazy(() => notification_seenSumOrderByAggregateInputObjectSchema)
      .optional(),
  })
  .strict();

export const notification_seenOrderByWithAggregationInputObjectSchema = Schema;
