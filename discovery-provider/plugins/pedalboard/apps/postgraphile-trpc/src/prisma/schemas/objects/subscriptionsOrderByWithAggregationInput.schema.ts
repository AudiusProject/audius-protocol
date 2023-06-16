import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { subscriptionsCountOrderByAggregateInputObjectSchema } from './subscriptionsCountOrderByAggregateInput.schema';
import { subscriptionsAvgOrderByAggregateInputObjectSchema } from './subscriptionsAvgOrderByAggregateInput.schema';
import { subscriptionsMaxOrderByAggregateInputObjectSchema } from './subscriptionsMaxOrderByAggregateInput.schema';
import { subscriptionsMinOrderByAggregateInputObjectSchema } from './subscriptionsMinOrderByAggregateInput.schema';
import { subscriptionsSumOrderByAggregateInputObjectSchema } from './subscriptionsSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.subscriptionsOrderByWithAggregationInput> = z
  .object({
    blockhash: z.lazy(() => SortOrderSchema).optional(),
    blocknumber: z.lazy(() => SortOrderSchema).optional(),
    subscriber_id: z.lazy(() => SortOrderSchema).optional(),
    user_id: z.lazy(() => SortOrderSchema).optional(),
    is_current: z.lazy(() => SortOrderSchema).optional(),
    is_delete: z.lazy(() => SortOrderSchema).optional(),
    created_at: z.lazy(() => SortOrderSchema).optional(),
    txhash: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => subscriptionsCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z
      .lazy(() => subscriptionsAvgOrderByAggregateInputObjectSchema)
      .optional(),
    _max: z
      .lazy(() => subscriptionsMaxOrderByAggregateInputObjectSchema)
      .optional(),
    _min: z
      .lazy(() => subscriptionsMinOrderByAggregateInputObjectSchema)
      .optional(),
    _sum: z
      .lazy(() => subscriptionsSumOrderByAggregateInputObjectSchema)
      .optional(),
  })
  .strict();

export const subscriptionsOrderByWithAggregationInputObjectSchema = Schema;
