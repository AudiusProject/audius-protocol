import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.audio_transactions_historyMinOrderByAggregateInput> =
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
    })
    .strict();

export const audio_transactions_historyMinOrderByAggregateInputObjectSchema =
  Schema;
