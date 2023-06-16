import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.subscriptionsAvgOrderByAggregateInput> = z
  .object({
    blocknumber: z.lazy(() => SortOrderSchema).optional(),
    subscriber_id: z.lazy(() => SortOrderSchema).optional(),
    user_id: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const subscriptionsAvgOrderByAggregateInputObjectSchema = Schema;
