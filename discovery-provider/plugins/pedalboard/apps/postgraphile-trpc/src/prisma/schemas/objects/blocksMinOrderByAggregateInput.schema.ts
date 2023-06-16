import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.blocksMinOrderByAggregateInput> = z
  .object({
    blockhash: z.lazy(() => SortOrderSchema).optional(),
    parenthash: z.lazy(() => SortOrderSchema).optional(),
    is_current: z.lazy(() => SortOrderSchema).optional(),
    number: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const blocksMinOrderByAggregateInputObjectSchema = Schema;
