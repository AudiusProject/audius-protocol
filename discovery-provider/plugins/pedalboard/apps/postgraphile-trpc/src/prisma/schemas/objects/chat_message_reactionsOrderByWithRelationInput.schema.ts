import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { chat_messageOrderByWithRelationInputObjectSchema } from './chat_messageOrderByWithRelationInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_message_reactionsOrderByWithRelationInput> =
  z
    .object({
      user_id: z.lazy(() => SortOrderSchema).optional(),
      message_id: z.lazy(() => SortOrderSchema).optional(),
      reaction: z.lazy(() => SortOrderSchema).optional(),
      created_at: z.lazy(() => SortOrderSchema).optional(),
      updated_at: z.lazy(() => SortOrderSchema).optional(),
      chat_message: z
        .lazy(() => chat_messageOrderByWithRelationInputObjectSchema)
        .optional(),
    })
    .strict();

export const chat_message_reactionsOrderByWithRelationInputObjectSchema =
  Schema;
