import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { user_bank_txsCountOrderByAggregateInputObjectSchema } from './user_bank_txsCountOrderByAggregateInput.schema';
import { user_bank_txsAvgOrderByAggregateInputObjectSchema } from './user_bank_txsAvgOrderByAggregateInput.schema';
import { user_bank_txsMaxOrderByAggregateInputObjectSchema } from './user_bank_txsMaxOrderByAggregateInput.schema';
import { user_bank_txsMinOrderByAggregateInputObjectSchema } from './user_bank_txsMinOrderByAggregateInput.schema';
import { user_bank_txsSumOrderByAggregateInputObjectSchema } from './user_bank_txsSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_bank_txsOrderByWithAggregationInput> = z
  .object({
    signature: z.lazy(() => SortOrderSchema).optional(),
    slot: z.lazy(() => SortOrderSchema).optional(),
    created_at: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => user_bank_txsCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z
      .lazy(() => user_bank_txsAvgOrderByAggregateInputObjectSchema)
      .optional(),
    _max: z
      .lazy(() => user_bank_txsMaxOrderByAggregateInputObjectSchema)
      .optional(),
    _min: z
      .lazy(() => user_bank_txsMinOrderByAggregateInputObjectSchema)
      .optional(),
    _sum: z
      .lazy(() => user_bank_txsSumOrderByAggregateInputObjectSchema)
      .optional(),
  })
  .strict();

export const user_bank_txsOrderByWithAggregationInputObjectSchema = Schema;
