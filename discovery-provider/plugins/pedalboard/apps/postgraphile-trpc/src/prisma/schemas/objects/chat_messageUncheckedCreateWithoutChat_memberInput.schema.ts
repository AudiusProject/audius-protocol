import { z } from 'zod';
import { chat_message_reactionsUncheckedCreateNestedManyWithoutChat_messageInputObjectSchema } from './chat_message_reactionsUncheckedCreateNestedManyWithoutChat_messageInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_messageUncheckedCreateWithoutChat_memberInput> =
  z
    .object({
      message_id: z.string(),
      created_at: z.coerce.date(),
      ciphertext: z.string(),
      chat_message_reactions: z
        .lazy(
          () =>
            chat_message_reactionsUncheckedCreateNestedManyWithoutChat_messageInputObjectSchema,
        )
        .optional(),
    })
    .strict();

export const chat_messageUncheckedCreateWithoutChat_memberInputObjectSchema =
  Schema;
