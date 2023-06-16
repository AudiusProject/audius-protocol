import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_memberAvgOrderByAggregateInput> = z
  .object({
    user_id: z.lazy(() => SortOrderSchema).optional(),
    invited_by_user_id: z.lazy(() => SortOrderSchema).optional(),
    unread_count: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const chat_memberAvgOrderByAggregateInputObjectSchema = Schema;
