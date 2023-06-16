import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.indexing_checkpointsMinOrderByAggregateInput> = z
  .object({
    tablename: z.lazy(() => SortOrderSchema).optional(),
    last_checkpoint: z.lazy(() => SortOrderSchema).optional(),
    signature: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const indexing_checkpointsMinOrderByAggregateInputObjectSchema = Schema;
