import { z } from 'zod';
import { chat_memberCreateNestedManyWithoutChatInputObjectSchema } from './chat_memberCreateNestedManyWithoutChatInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chatCreateInput> = z
  .object({
    chat_id: z.string(),
    created_at: z.coerce.date(),
    last_message_at: z.coerce.date(),
    last_message: z.string().optional().nullable(),
    chat_member: z
      .lazy(() => chat_memberCreateNestedManyWithoutChatInputObjectSchema)
      .optional(),
  })
  .strict();

export const chatCreateInputObjectSchema = Schema;
