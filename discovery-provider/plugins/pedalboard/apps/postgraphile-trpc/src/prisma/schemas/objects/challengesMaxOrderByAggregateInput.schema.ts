import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.challengesMaxOrderByAggregateInput> = z
  .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    type: z.lazy(() => SortOrderSchema).optional(),
    amount: z.lazy(() => SortOrderSchema).optional(),
    active: z.lazy(() => SortOrderSchema).optional(),
    step_count: z.lazy(() => SortOrderSchema).optional(),
    starting_block: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const challengesMaxOrderByAggregateInputObjectSchema = Schema;
