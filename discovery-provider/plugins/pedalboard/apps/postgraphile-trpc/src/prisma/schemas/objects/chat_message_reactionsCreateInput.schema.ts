import { z } from 'zod';
import { chat_messageCreateNestedOneWithoutChat_message_reactionsInputObjectSchema } from './chat_messageCreateNestedOneWithoutChat_message_reactionsInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_message_reactionsCreateInput> = z
  .object({
    user_id: z.number(),
    reaction: z.string(),
    created_at: z.coerce.date().optional(),
    updated_at: z.coerce.date().optional(),
    chat_message: z.lazy(
      () =>
        chat_messageCreateNestedOneWithoutChat_message_reactionsInputObjectSchema,
    ),
  })
  .strict();

export const chat_message_reactionsCreateInputObjectSchema = Schema;
