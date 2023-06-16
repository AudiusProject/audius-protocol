import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.cid_dataCountOrderByAggregateInput> = z
  .object({
    cid: z.lazy(() => SortOrderSchema).optional(),
    type: z.lazy(() => SortOrderSchema).optional(),
    data: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const cid_dataCountOrderByAggregateInputObjectSchema = Schema;
