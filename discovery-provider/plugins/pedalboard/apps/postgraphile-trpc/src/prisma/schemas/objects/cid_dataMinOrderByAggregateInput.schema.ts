import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.cid_dataMinOrderByAggregateInput> = z
  .object({
    cid: z.lazy(() => SortOrderSchema).optional(),
    type: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const cid_dataMinOrderByAggregateInputObjectSchema = Schema;
