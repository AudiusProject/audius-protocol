import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_trackMinOrderByAggregateInput> = z
  .object({
    track_id: z.lazy(() => SortOrderSchema).optional(),
    repost_count: z.lazy(() => SortOrderSchema).optional(),
    save_count: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const aggregate_trackMinOrderByAggregateInputObjectSchema = Schema;
