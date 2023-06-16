import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_delist_statusesCountOrderByAggregateInput> =
  z
    .object({
      created_at: z.lazy(() => SortOrderSchema).optional(),
      user_id: z.lazy(() => SortOrderSchema).optional(),
      delisted: z.lazy(() => SortOrderSchema).optional(),
      reason: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const user_delist_statusesCountOrderByAggregateInputObjectSchema =
  Schema;
