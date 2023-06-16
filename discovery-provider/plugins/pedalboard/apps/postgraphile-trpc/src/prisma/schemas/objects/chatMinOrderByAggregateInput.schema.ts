import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chatMinOrderByAggregateInput> = z
  .object({
    chat_id: z.lazy(() => SortOrderSchema).optional(),
    created_at: z.lazy(() => SortOrderSchema).optional(),
    last_message_at: z.lazy(() => SortOrderSchema).optional(),
    last_message: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const chatMinOrderByAggregateInputObjectSchema = Schema;
