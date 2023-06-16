import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.delist_status_cursorMaxOrderByAggregateInput> = z
  .object({
    host: z.lazy(() => SortOrderSchema).optional(),
    entity: z.lazy(() => SortOrderSchema).optional(),
    created_at: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const delist_status_cursorMaxOrderByAggregateInputObjectSchema = Schema;
