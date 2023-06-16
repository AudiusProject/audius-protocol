import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.audio_transactions_historyAvgOrderByAggregateInput> =
  z
    .object({
      slot: z.lazy(() => SortOrderSchema).optional(),
      change: z.lazy(() => SortOrderSchema).optional(),
      balance: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const audio_transactions_historyAvgOrderByAggregateInputObjectSchema =
  Schema;
