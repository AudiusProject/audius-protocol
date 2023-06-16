import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { skipped_transactionsCountOrderByAggregateInputObjectSchema } from './skipped_transactionsCountOrderByAggregateInput.schema';
import { skipped_transactionsAvgOrderByAggregateInputObjectSchema } from './skipped_transactionsAvgOrderByAggregateInput.schema';
import { skipped_transactionsMaxOrderByAggregateInputObjectSchema } from './skipped_transactionsMaxOrderByAggregateInput.schema';
import { skipped_transactionsMinOrderByAggregateInputObjectSchema } from './skipped_transactionsMinOrderByAggregateInput.schema';
import { skipped_transactionsSumOrderByAggregateInputObjectSchema } from './skipped_transactionsSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.skipped_transactionsOrderByWithAggregationInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      blocknumber: z.lazy(() => SortOrderSchema).optional(),
      blockhash: z.lazy(() => SortOrderSchema).optional(),
      txhash: z.lazy(() => SortOrderSchema).optional(),
      created_at: z.lazy(() => SortOrderSchema).optional(),
      updated_at: z.lazy(() => SortOrderSchema).optional(),
      level: z.lazy(() => SortOrderSchema).optional(),
      _count: z
        .lazy(() => skipped_transactionsCountOrderByAggregateInputObjectSchema)
        .optional(),
      _avg: z
        .lazy(() => skipped_transactionsAvgOrderByAggregateInputObjectSchema)
        .optional(),
      _max: z
        .lazy(() => skipped_transactionsMaxOrderByAggregateInputObjectSchema)
        .optional(),
      _min: z
        .lazy(() => skipped_transactionsMinOrderByAggregateInputObjectSchema)
        .optional(),
      _sum: z
        .lazy(() => skipped_transactionsSumOrderByAggregateInputObjectSchema)
        .optional(),
    })
    .strict();

export const skipped_transactionsOrderByWithAggregationInputObjectSchema =
  Schema;
