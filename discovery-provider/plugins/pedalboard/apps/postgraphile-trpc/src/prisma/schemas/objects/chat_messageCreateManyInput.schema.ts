import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_messageCreateManyInput> = z
  .object({
    message_id: z.string(),
    chat_id: z.string(),
    user_id: z.number(),
    created_at: z.coerce.date(),
    ciphertext: z.string(),
  })
  .strict();

export const chat_messageCreateManyInputObjectSchema = Schema;
