import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.ChatMinAggregateInputType> = z
  .object({
    chat_id: z.literal(true).optional(),
    created_at: z.literal(true).optional(),
    last_message_at: z.literal(true).optional(),
    last_message: z.literal(true).optional(),
  })
  .strict();

export const ChatMinAggregateInputObjectSchema = Schema;
