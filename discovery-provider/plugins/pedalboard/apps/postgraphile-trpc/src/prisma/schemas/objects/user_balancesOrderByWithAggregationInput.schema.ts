import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { user_balancesCountOrderByAggregateInputObjectSchema } from './user_balancesCountOrderByAggregateInput.schema';
import { user_balancesAvgOrderByAggregateInputObjectSchema } from './user_balancesAvgOrderByAggregateInput.schema';
import { user_balancesMaxOrderByAggregateInputObjectSchema } from './user_balancesMaxOrderByAggregateInput.schema';
import { user_balancesMinOrderByAggregateInputObjectSchema } from './user_balancesMinOrderByAggregateInput.schema';
import { user_balancesSumOrderByAggregateInputObjectSchema } from './user_balancesSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_balancesOrderByWithAggregationInput> = z
  .object({
    user_id: z.lazy(() => SortOrderSchema).optional(),
    balance: z.lazy(() => SortOrderSchema).optional(),
    created_at: z.lazy(() => SortOrderSchema).optional(),
    updated_at: z.lazy(() => SortOrderSchema).optional(),
    associated_wallets_balance: z.lazy(() => SortOrderSchema).optional(),
    waudio: z.lazy(() => SortOrderSchema).optional(),
    associated_sol_wallets_balance: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => user_balancesCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z
      .lazy(() => user_balancesAvgOrderByAggregateInputObjectSchema)
      .optional(),
    _max: z
      .lazy(() => user_balancesMaxOrderByAggregateInputObjectSchema)
      .optional(),
    _min: z
      .lazy(() => user_balancesMinOrderByAggregateInputObjectSchema)
      .optional(),
    _sum: z
      .lazy(() => user_balancesSumOrderByAggregateInputObjectSchema)
      .optional(),
  })
  .strict();

export const user_balancesOrderByWithAggregationInputObjectSchema = Schema;
