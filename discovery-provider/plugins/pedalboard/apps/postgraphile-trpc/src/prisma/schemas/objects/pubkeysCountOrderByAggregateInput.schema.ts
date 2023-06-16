import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.pubkeysCountOrderByAggregateInput> = z
  .object({
    wallet: z.lazy(() => SortOrderSchema).optional(),
    pubkey: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const pubkeysCountOrderByAggregateInputObjectSchema = Schema;
