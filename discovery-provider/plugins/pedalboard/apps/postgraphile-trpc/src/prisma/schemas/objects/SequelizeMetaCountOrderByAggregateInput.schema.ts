import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.SequelizeMetaCountOrderByAggregateInput> = z
  .object({
    name: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const SequelizeMetaCountOrderByAggregateInputObjectSchema = Schema;
