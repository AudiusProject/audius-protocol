import { z } from 'zod';
import { chat_memberUncheckedCreateNestedManyWithoutChatInputObjectSchema } from './chat_memberUncheckedCreateNestedManyWithoutChatInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chatUncheckedCreateInput> = z
  .object({
    chat_id: z.string(),
    created_at: z.coerce.date(),
    last_message_at: z.coerce.date(),
    last_message: z.string().optional().nullable(),
    chat_member: z
      .lazy(
        () => chat_memberUncheckedCreateNestedManyWithoutChatInputObjectSchema,
      )
      .optional(),
  })
  .strict();

export const chatUncheckedCreateInputObjectSchema = Schema;
