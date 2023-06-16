import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { chatOrderByWithRelationInputObjectSchema } from './chatOrderByWithRelationInput.schema';
import { chat_messageOrderByRelationAggregateInputObjectSchema } from './chat_messageOrderByRelationAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_memberOrderByWithRelationInput> = z
  .object({
    chat_id: z.lazy(() => SortOrderSchema).optional(),
    user_id: z.lazy(() => SortOrderSchema).optional(),
    cleared_history_at: z.lazy(() => SortOrderSchema).optional(),
    invited_by_user_id: z.lazy(() => SortOrderSchema).optional(),
    invite_code: z.lazy(() => SortOrderSchema).optional(),
    last_active_at: z.lazy(() => SortOrderSchema).optional(),
    unread_count: z.lazy(() => SortOrderSchema).optional(),
    chat: z.lazy(() => chatOrderByWithRelationInputObjectSchema).optional(),
    chat_message: z
      .lazy(() => chat_messageOrderByRelationAggregateInputObjectSchema)
      .optional(),
  })
  .strict();

export const chat_memberOrderByWithRelationInputObjectSchema = Schema;
