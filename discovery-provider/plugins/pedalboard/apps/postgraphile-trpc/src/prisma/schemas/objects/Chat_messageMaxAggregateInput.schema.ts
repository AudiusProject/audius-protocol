import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Chat_messageMaxAggregateInputType> = z
  .object({
    message_id: z.literal(true).optional(),
    chat_id: z.literal(true).optional(),
    user_id: z.literal(true).optional(),
    created_at: z.literal(true).optional(),
    ciphertext: z.literal(true).optional(),
  })
  .strict();

export const Chat_messageMaxAggregateInputObjectSchema = Schema;
