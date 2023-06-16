import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { audio_transactions_historyCountOrderByAggregateInputObjectSchema } from './audio_transactions_historyCountOrderByAggregateInput.schema';
import { audio_transactions_historyAvgOrderByAggregateInputObjectSchema } from './audio_transactions_historyAvgOrderByAggregateInput.schema';
import { audio_transactions_historyMaxOrderByAggregateInputObjectSchema } from './audio_transactions_historyMaxOrderByAggregateInput.schema';
import { audio_transactions_historyMinOrderByAggregateInputObjectSchema } from './audio_transactions_historyMinOrderByAggregateInput.schema';
import { audio_transactions_historySumOrderByAggregateInputObjectSchema } from './audio_transactions_historySumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.audio_transactions_historyOrderByWithAggregationInput> =
  z
    .object({
      user_bank: z.lazy(() => SortOrderSchema).optional(),
      slot: z.lazy(() => SortOrderSchema).optional(),
      signature: z.lazy(() => SortOrderSchema).optional(),
      transaction_type: z.lazy(() => SortOrderSchema).optional(),
      method: z.lazy(() => SortOrderSchema).optional(),
      created_at: z.lazy(() => SortOrderSchema).optional(),
      updated_at: z.lazy(() => SortOrderSchema).optional(),
      transaction_created_at: z.lazy(() => SortOrderSchema).optional(),
      change: z.lazy(() => SortOrderSchema).optional(),
      balance: z.lazy(() => SortOrderSchema).optional(),
      tx_metadata: z.lazy(() => SortOrderSchema).optional(),
      _count: z
        .lazy(
          () =>
            audio_transactions_historyCountOrderByAggregateInputObjectSchema,
        )
        .optional(),
      _avg: z
        .lazy(
          () => audio_transactions_historyAvgOrderByAggregateInputObjectSchema,
        )
        .optional(),
      _max: z
        .lazy(
          () => audio_transactions_historyMaxOrderByAggregateInputObjectSchema,
        )
        .optional(),
      _min: z
        .lazy(
          () => audio_transactions_historyMinOrderByAggregateInputObjectSchema,
        )
        .optional(),
      _sum: z
        .lazy(
          () => audio_transactions_historySumOrderByAggregateInputObjectSchema,
        )
        .optional(),
    })
    .strict();

export const audio_transactions_historyOrderByWithAggregationInputObjectSchema =
  Schema;
