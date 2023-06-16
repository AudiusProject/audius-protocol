import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.remixesMaxOrderByAggregateInput> = z
  .object({
    parent_track_id: z.lazy(() => SortOrderSchema).optional(),
    child_track_id: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const remixesMaxOrderByAggregateInputObjectSchema = Schema;
