import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { rewards_manager_backfill_txsCountOrderByAggregateInputObjectSchema } from './rewards_manager_backfill_txsCountOrderByAggregateInput.schema';
import { rewards_manager_backfill_txsAvgOrderByAggregateInputObjectSchema } from './rewards_manager_backfill_txsAvgOrderByAggregateInput.schema';
import { rewards_manager_backfill_txsMaxOrderByAggregateInputObjectSchema } from './rewards_manager_backfill_txsMaxOrderByAggregateInput.schema';
import { rewards_manager_backfill_txsMinOrderByAggregateInputObjectSchema } from './rewards_manager_backfill_txsMinOrderByAggregateInput.schema';
import { rewards_manager_backfill_txsSumOrderByAggregateInputObjectSchema } from './rewards_manager_backfill_txsSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.rewards_manager_backfill_txsOrderByWithAggregationInput> =
  z
    .object({
      signature: z.lazy(() => SortOrderSchema).optional(),
      slot: z.lazy(() => SortOrderSchema).optional(),
      created_at: z.lazy(() => SortOrderSchema).optional(),
      _count: z
        .lazy(
          () =>
            rewards_manager_backfill_txsCountOrderByAggregateInputObjectSchema,
        )
        .optional(),
      _avg: z
        .lazy(
          () =>
            rewards_manager_backfill_txsAvgOrderByAggregateInputObjectSchema,
        )
        .optional(),
      _max: z
        .lazy(
          () =>
            rewards_manager_backfill_txsMaxOrderByAggregateInputObjectSchema,
        )
        .optional(),
      _min: z
        .lazy(
          () =>
            rewards_manager_backfill_txsMinOrderByAggregateInputObjectSchema,
        )
        .optional(),
      _sum: z
        .lazy(
          () =>
            rewards_manager_backfill_txsSumOrderByAggregateInputObjectSchema,
        )
        .optional(),
    })
    .strict();

export const rewards_manager_backfill_txsOrderByWithAggregationInputObjectSchema =
  Schema;
