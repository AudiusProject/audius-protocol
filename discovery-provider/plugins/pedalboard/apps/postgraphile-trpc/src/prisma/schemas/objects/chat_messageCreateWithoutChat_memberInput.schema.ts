import { z } from 'zod';
import { chat_message_reactionsCreateNestedManyWithoutChat_messageInputObjectSchema } from './chat_message_reactionsCreateNestedManyWithoutChat_messageInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_messageCreateWithoutChat_memberInput> = z
  .object({
    message_id: z.string(),
    created_at: z.coerce.date(),
    ciphertext: z.string(),
    chat_message_reactions: z
      .lazy(
        () =>
          chat_message_reactionsCreateNestedManyWithoutChat_messageInputObjectSchema,
      )
      .optional(),
  })
  .strict();

export const chat_messageCreateWithoutChat_memberInputObjectSchema = Schema;
