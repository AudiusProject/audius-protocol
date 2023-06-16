import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { spl_token_backfill_txsCountOrderByAggregateInputObjectSchema } from './spl_token_backfill_txsCountOrderByAggregateInput.schema';
import { spl_token_backfill_txsAvgOrderByAggregateInputObjectSchema } from './spl_token_backfill_txsAvgOrderByAggregateInput.schema';
import { spl_token_backfill_txsMaxOrderByAggregateInputObjectSchema } from './spl_token_backfill_txsMaxOrderByAggregateInput.schema';
import { spl_token_backfill_txsMinOrderByAggregateInputObjectSchema } from './spl_token_backfill_txsMinOrderByAggregateInput.schema';
import { spl_token_backfill_txsSumOrderByAggregateInputObjectSchema } from './spl_token_backfill_txsSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.spl_token_backfill_txsOrderByWithAggregationInput> =
  z
    .object({
      last_scanned_slot: z.lazy(() => SortOrderSchema).optional(),
      signature: z.lazy(() => SortOrderSchema).optional(),
      created_at: z.lazy(() => SortOrderSchema).optional(),
      updated_at: z.lazy(() => SortOrderSchema).optional(),
      _count: z
        .lazy(
          () => spl_token_backfill_txsCountOrderByAggregateInputObjectSchema,
        )
        .optional(),
      _avg: z
        .lazy(() => spl_token_backfill_txsAvgOrderByAggregateInputObjectSchema)
        .optional(),
      _max: z
        .lazy(() => spl_token_backfill_txsMaxOrderByAggregateInputObjectSchema)
        .optional(),
      _min: z
        .lazy(() => spl_token_backfill_txsMinOrderByAggregateInputObjectSchema)
        .optional(),
      _sum: z
        .lazy(() => spl_token_backfill_txsSumOrderByAggregateInputObjectSchema)
        .optional(),
    })
    .strict();

export const spl_token_backfill_txsOrderByWithAggregationInputObjectSchema =
  Schema;
