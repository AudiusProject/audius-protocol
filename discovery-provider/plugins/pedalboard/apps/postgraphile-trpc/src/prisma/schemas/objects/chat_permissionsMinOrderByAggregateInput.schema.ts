import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_permissionsMinOrderByAggregateInput> = z
  .object({
    user_id: z.lazy(() => SortOrderSchema).optional(),
    permits: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const chat_permissionsMinOrderByAggregateInputObjectSchema = Schema;
