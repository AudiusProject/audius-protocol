import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.hourly_play_countsMaxOrderByAggregateInput> = z
  .object({
    hourly_timestamp: z.lazy(() => SortOrderSchema).optional(),
    play_count: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const hourly_play_countsMaxOrderByAggregateInputObjectSchema = Schema;
