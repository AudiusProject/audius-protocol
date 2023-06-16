import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_messageCountOrderByAggregateInput> = z
  .object({
    message_id: z.lazy(() => SortOrderSchema).optional(),
    chat_id: z.lazy(() => SortOrderSchema).optional(),
    user_id: z.lazy(() => SortOrderSchema).optional(),
    created_at: z.lazy(() => SortOrderSchema).optional(),
    ciphertext: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const chat_messageCountOrderByAggregateInputObjectSchema = Schema;
