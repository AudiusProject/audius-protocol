import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { user_bank_accountsCountOrderByAggregateInputObjectSchema } from './user_bank_accountsCountOrderByAggregateInput.schema';
import { user_bank_accountsMaxOrderByAggregateInputObjectSchema } from './user_bank_accountsMaxOrderByAggregateInput.schema';
import { user_bank_accountsMinOrderByAggregateInputObjectSchema } from './user_bank_accountsMinOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_bank_accountsOrderByWithAggregationInput> =
  z
    .object({
      signature: z.lazy(() => SortOrderSchema).optional(),
      ethereum_address: z.lazy(() => SortOrderSchema).optional(),
      created_at: z.lazy(() => SortOrderSchema).optional(),
      bank_account: z.lazy(() => SortOrderSchema).optional(),
      _count: z
        .lazy(() => user_bank_accountsCountOrderByAggregateInputObjectSchema)
        .optional(),
      _max: z
        .lazy(() => user_bank_accountsMaxOrderByAggregateInputObjectSchema)
        .optional(),
      _min: z
        .lazy(() => user_bank_accountsMinOrderByAggregateInputObjectSchema)
        .optional(),
    })
    .strict();

export const user_bank_accountsOrderByWithAggregationInputObjectSchema = Schema;
