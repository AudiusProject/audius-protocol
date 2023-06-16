import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chatUncheckedCreateWithoutChat_memberInput> = z
  .object({
    chat_id: z.string(),
    created_at: z.coerce.date(),
    last_message_at: z.coerce.date(),
    last_message: z.string().optional().nullable(),
  })
  .strict();

export const chatUncheckedCreateWithoutChat_memberInputObjectSchema = Schema;
