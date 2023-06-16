import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_blocked_usersSumOrderByAggregateInput> = z
  .object({
    blocker_user_id: z.lazy(() => SortOrderSchema).optional(),
    blockee_user_id: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const chat_blocked_usersSumOrderByAggregateInputObjectSchema = Schema;
