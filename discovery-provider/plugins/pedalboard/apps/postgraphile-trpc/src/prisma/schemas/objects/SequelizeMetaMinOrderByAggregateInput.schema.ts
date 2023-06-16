import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.SequelizeMetaMinOrderByAggregateInput> = z
  .object({
    name: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const SequelizeMetaMinOrderByAggregateInputObjectSchema = Schema;
