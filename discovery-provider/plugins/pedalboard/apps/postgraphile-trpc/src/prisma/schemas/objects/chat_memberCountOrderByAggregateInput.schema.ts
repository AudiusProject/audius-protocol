import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_memberCountOrderByAggregateInput> = z
  .object({
    chat_id: z.lazy(() => SortOrderSchema).optional(),
    user_id: z.lazy(() => SortOrderSchema).optional(),
    cleared_history_at: z.lazy(() => SortOrderSchema).optional(),
    invited_by_user_id: z.lazy(() => SortOrderSchema).optional(),
    invite_code: z.lazy(() => SortOrderSchema).optional(),
    last_active_at: z.lazy(() => SortOrderSchema).optional(),
    unread_count: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const chat_memberCountOrderByAggregateInputObjectSchema = Schema;
