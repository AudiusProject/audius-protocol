import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.trending_resultsSumOrderByAggregateInput> = z
  .object({
    user_id: z.lazy(() => SortOrderSchema).optional(),
    rank: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const trending_resultsSumOrderByAggregateInputObjectSchema = Schema;
