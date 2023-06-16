import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { chat_memberOrderByRelationAggregateInputObjectSchema } from './chat_memberOrderByRelationAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chatOrderByWithRelationInput> = z
  .object({
    chat_id: z.lazy(() => SortOrderSchema).optional(),
    created_at: z.lazy(() => SortOrderSchema).optional(),
    last_message_at: z.lazy(() => SortOrderSchema).optional(),
    last_message: z.lazy(() => SortOrderSchema).optional(),
    chat_member: z
      .lazy(() => chat_memberOrderByRelationAggregateInputObjectSchema)
      .optional(),
  })
  .strict();

export const chatOrderByWithRelationInputObjectSchema = Schema;
