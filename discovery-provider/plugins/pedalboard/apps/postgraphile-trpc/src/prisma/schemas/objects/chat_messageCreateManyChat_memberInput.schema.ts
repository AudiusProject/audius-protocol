import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_messageCreateManyChat_memberInput> = z
  .object({
    message_id: z.string(),
    created_at: z.coerce.date(),
    ciphertext: z.string(),
  })
  .strict();

export const chat_messageCreateManyChat_memberInputObjectSchema = Schema;
