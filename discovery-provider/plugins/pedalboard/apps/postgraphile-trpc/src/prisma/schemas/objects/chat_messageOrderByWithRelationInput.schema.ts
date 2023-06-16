import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { chat_memberOrderByWithRelationInputObjectSchema } from './chat_memberOrderByWithRelationInput.schema';
import { chat_message_reactionsOrderByRelationAggregateInputObjectSchema } from './chat_message_reactionsOrderByRelationAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_messageOrderByWithRelationInput> = z
  .object({
    message_id: z.lazy(() => SortOrderSchema).optional(),
    chat_id: z.lazy(() => SortOrderSchema).optional(),
    user_id: z.lazy(() => SortOrderSchema).optional(),
    created_at: z.lazy(() => SortOrderSchema).optional(),
    ciphertext: z.lazy(() => SortOrderSchema).optional(),
    chat_member: z
      .lazy(() => chat_memberOrderByWithRelationInputObjectSchema)
      .optional(),
    chat_message_reactions: z
      .lazy(
        () => chat_message_reactionsOrderByRelationAggregateInputObjectSchema,
      )
      .optional(),
  })
  .strict();

export const chat_messageOrderByWithRelationInputObjectSchema = Schema;
