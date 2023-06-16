import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.reactionsSumOrderByAggregateInput> = z
  .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    slot: z.lazy(() => SortOrderSchema).optional(),
    reaction_value: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const reactionsSumOrderByAggregateInputObjectSchema = Schema;
