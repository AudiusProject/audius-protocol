import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.spl_token_backfill_txsSumOrderByAggregateInput> =
  z
    .object({
      last_scanned_slot: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const spl_token_backfill_txsSumOrderByAggregateInputObjectSchema =
  Schema;
