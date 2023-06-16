import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.reward_manager_txsSumOrderByAggregateInput> = z
  .object({
    slot: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const reward_manager_txsSumOrderByAggregateInputObjectSchema = Schema;
