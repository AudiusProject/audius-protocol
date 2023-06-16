import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { user_balance_changesCountOrderByAggregateInputObjectSchema } from './user_balance_changesCountOrderByAggregateInput.schema';
import { user_balance_changesAvgOrderByAggregateInputObjectSchema } from './user_balance_changesAvgOrderByAggregateInput.schema';
import { user_balance_changesMaxOrderByAggregateInputObjectSchema } from './user_balance_changesMaxOrderByAggregateInput.schema';
import { user_balance_changesMinOrderByAggregateInputObjectSchema } from './user_balance_changesMinOrderByAggregateInput.schema';
import { user_balance_changesSumOrderByAggregateInputObjectSchema } from './user_balance_changesSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_balance_changesOrderByWithAggregationInput> =
  z
    .object({
      user_id: z.lazy(() => SortOrderSchema).optional(),
      blocknumber: z.lazy(() => SortOrderSchema).optional(),
      current_balance: z.lazy(() => SortOrderSchema).optional(),
      previous_balance: z.lazy(() => SortOrderSchema).optional(),
      created_at: z.lazy(() => SortOrderSchema).optional(),
      updated_at: z.lazy(() => SortOrderSchema).optional(),
      _count: z
        .lazy(() => user_balance_changesCountOrderByAggregateInputObjectSchema)
        .optional(),
      _avg: z
        .lazy(() => user_balance_changesAvgOrderByAggregateInputObjectSchema)
        .optional(),
      _max: z
        .lazy(() => user_balance_changesMaxOrderByAggregateInputObjectSchema)
        .optional(),
      _min: z
        .lazy(() => user_balance_changesMinOrderByAggregateInputObjectSchema)
        .optional(),
      _sum: z
        .lazy(() => user_balance_changesSumOrderByAggregateInputObjectSchema)
        .optional(),
    })
    .strict();

export const user_balance_changesOrderByWithAggregationInputObjectSchema =
  Schema;
