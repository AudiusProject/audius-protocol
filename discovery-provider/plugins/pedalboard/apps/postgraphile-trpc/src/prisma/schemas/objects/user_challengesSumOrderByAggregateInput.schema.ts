import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_challengesSumOrderByAggregateInput> = z
  .object({
    user_id: z.lazy(() => SortOrderSchema).optional(),
    current_step_count: z.lazy(() => SortOrderSchema).optional(),
    completed_blocknumber: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const user_challengesSumOrderByAggregateInputObjectSchema = Schema;
