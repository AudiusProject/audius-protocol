import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_message_reactionsUncheckedCreateInput> = z
  .object({
    user_id: z.number(),
    message_id: z.string(),
    reaction: z.string(),
    created_at: z.coerce.date().optional(),
    updated_at: z.coerce.date().optional(),
  })
  .strict();

export const chat_message_reactionsUncheckedCreateInputObjectSchema = Schema;
