import { z } from 'zod';
import { chat_memberCreateNestedOneWithoutChat_messageInputObjectSchema } from './chat_memberCreateNestedOneWithoutChat_messageInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_messageCreateWithoutChat_message_reactionsInput> =
  z
    .object({
      message_id: z.string(),
      created_at: z.coerce.date(),
      ciphertext: z.string(),
      chat_member: z.lazy(
        () => chat_memberCreateNestedOneWithoutChat_messageInputObjectSchema,
      ),
    })
    .strict();

export const chat_messageCreateWithoutChat_message_reactionsInputObjectSchema =
  Schema;
