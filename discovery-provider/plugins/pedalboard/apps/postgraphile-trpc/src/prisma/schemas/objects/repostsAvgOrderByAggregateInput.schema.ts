import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.repostsAvgOrderByAggregateInput> = z
  .object({
    blocknumber: z.lazy(() => SortOrderSchema).optional(),
    user_id: z.lazy(() => SortOrderSchema).optional(),
    repost_item_id: z.lazy(() => SortOrderSchema).optional(),
    slot: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const repostsAvgOrderByAggregateInputObjectSchema = Schema;
