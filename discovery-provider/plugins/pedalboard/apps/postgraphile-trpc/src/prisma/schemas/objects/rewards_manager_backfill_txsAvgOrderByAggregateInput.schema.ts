import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.rewards_manager_backfill_txsAvgOrderByAggregateInput> =
  z
    .object({
      slot: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const rewards_manager_backfill_txsAvgOrderByAggregateInputObjectSchema =
  Schema;
