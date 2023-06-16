import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_playsSumOrderByAggregateInput> = z
  .object({
    play_item_id: z.lazy(() => SortOrderSchema).optional(),
    count: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const aggregate_playsSumOrderByAggregateInputObjectSchema = Schema;
