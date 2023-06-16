import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { user_listening_historyCountOrderByAggregateInputObjectSchema } from './user_listening_historyCountOrderByAggregateInput.schema';
import { user_listening_historyAvgOrderByAggregateInputObjectSchema } from './user_listening_historyAvgOrderByAggregateInput.schema';
import { user_listening_historyMaxOrderByAggregateInputObjectSchema } from './user_listening_historyMaxOrderByAggregateInput.schema';
import { user_listening_historyMinOrderByAggregateInputObjectSchema } from './user_listening_historyMinOrderByAggregateInput.schema';
import { user_listening_historySumOrderByAggregateInputObjectSchema } from './user_listening_historySumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_listening_historyOrderByWithAggregationInput> =
  z
    .object({
      user_id: z.lazy(() => SortOrderSchema).optional(),
      listening_history: z.lazy(() => SortOrderSchema).optional(),
      _count: z
        .lazy(
          () => user_listening_historyCountOrderByAggregateInputObjectSchema,
        )
        .optional(),
      _avg: z
        .lazy(() => user_listening_historyAvgOrderByAggregateInputObjectSchema)
        .optional(),
      _max: z
        .lazy(() => user_listening_historyMaxOrderByAggregateInputObjectSchema)
        .optional(),
      _min: z
        .lazy(() => user_listening_historyMinOrderByAggregateInputObjectSchema)
        .optional(),
      _sum: z
        .lazy(() => user_listening_historySumOrderByAggregateInputObjectSchema)
        .optional(),
    })
    .strict();

export const user_listening_historyOrderByWithAggregationInputObjectSchema =
  Schema;
