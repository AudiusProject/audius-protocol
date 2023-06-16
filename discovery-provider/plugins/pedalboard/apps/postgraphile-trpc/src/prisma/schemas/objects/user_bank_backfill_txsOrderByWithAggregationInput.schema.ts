import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { user_bank_backfill_txsCountOrderByAggregateInputObjectSchema } from './user_bank_backfill_txsCountOrderByAggregateInput.schema';
import { user_bank_backfill_txsAvgOrderByAggregateInputObjectSchema } from './user_bank_backfill_txsAvgOrderByAggregateInput.schema';
import { user_bank_backfill_txsMaxOrderByAggregateInputObjectSchema } from './user_bank_backfill_txsMaxOrderByAggregateInput.schema';
import { user_bank_backfill_txsMinOrderByAggregateInputObjectSchema } from './user_bank_backfill_txsMinOrderByAggregateInput.schema';
import { user_bank_backfill_txsSumOrderByAggregateInputObjectSchema } from './user_bank_backfill_txsSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_bank_backfill_txsOrderByWithAggregationInput> =
  z
    .object({
      signature: z.lazy(() => SortOrderSchema).optional(),
      slot: z.lazy(() => SortOrderSchema).optional(),
      created_at: z.lazy(() => SortOrderSchema).optional(),
      _count: z
        .lazy(
          () => user_bank_backfill_txsCountOrderByAggregateInputObjectSchema,
        )
        .optional(),
      _avg: z
        .lazy(() => user_bank_backfill_txsAvgOrderByAggregateInputObjectSchema)
        .optional(),
      _max: z
        .lazy(() => user_bank_backfill_txsMaxOrderByAggregateInputObjectSchema)
        .optional(),
      _min: z
        .lazy(() => user_bank_backfill_txsMinOrderByAggregateInputObjectSchema)
        .optional(),
      _sum: z
        .lazy(() => user_bank_backfill_txsSumOrderByAggregateInputObjectSchema)
        .optional(),
    })
    .strict();

export const user_bank_backfill_txsOrderByWithAggregationInputObjectSchema =
  Schema;
