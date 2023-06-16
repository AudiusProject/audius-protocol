import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { user_eventsCountOrderByAggregateInputObjectSchema } from './user_eventsCountOrderByAggregateInput.schema';
import { user_eventsAvgOrderByAggregateInputObjectSchema } from './user_eventsAvgOrderByAggregateInput.schema';
import { user_eventsMaxOrderByAggregateInputObjectSchema } from './user_eventsMaxOrderByAggregateInput.schema';
import { user_eventsMinOrderByAggregateInputObjectSchema } from './user_eventsMinOrderByAggregateInput.schema';
import { user_eventsSumOrderByAggregateInputObjectSchema } from './user_eventsSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_eventsOrderByWithAggregationInput> = z
  .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    blockhash: z.lazy(() => SortOrderSchema).optional(),
    blocknumber: z.lazy(() => SortOrderSchema).optional(),
    is_current: z.lazy(() => SortOrderSchema).optional(),
    user_id: z.lazy(() => SortOrderSchema).optional(),
    referrer: z.lazy(() => SortOrderSchema).optional(),
    is_mobile_user: z.lazy(() => SortOrderSchema).optional(),
    slot: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => user_eventsCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z
      .lazy(() => user_eventsAvgOrderByAggregateInputObjectSchema)
      .optional(),
    _max: z
      .lazy(() => user_eventsMaxOrderByAggregateInputObjectSchema)
      .optional(),
    _min: z
      .lazy(() => user_eventsMinOrderByAggregateInputObjectSchema)
      .optional(),
    _sum: z
      .lazy(() => user_eventsSumOrderByAggregateInputObjectSchema)
      .optional(),
  })
  .strict();

export const user_eventsOrderByWithAggregationInputObjectSchema = Schema;
