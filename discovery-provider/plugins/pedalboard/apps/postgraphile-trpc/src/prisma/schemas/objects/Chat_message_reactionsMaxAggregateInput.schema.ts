import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Chat_message_reactionsMaxAggregateInputType> = z
  .object({
    user_id: z.literal(true).optional(),
    message_id: z.literal(true).optional(),
    reaction: z.literal(true).optional(),
    created_at: z.literal(true).optional(),
    updated_at: z.literal(true).optional(),
  })
  .strict();

export const Chat_message_reactionsMaxAggregateInputObjectSchema = Schema;
