import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_delist_statusesAvgOrderByAggregateInput> = z
  .object({
    user_id: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const user_delist_statusesAvgOrderByAggregateInputObjectSchema = Schema;
