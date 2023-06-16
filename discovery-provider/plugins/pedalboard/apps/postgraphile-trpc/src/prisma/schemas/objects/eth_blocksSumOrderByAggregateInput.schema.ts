import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.eth_blocksSumOrderByAggregateInput> = z
  .object({
    last_scanned_block: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const eth_blocksSumOrderByAggregateInputObjectSchema = Schema;
