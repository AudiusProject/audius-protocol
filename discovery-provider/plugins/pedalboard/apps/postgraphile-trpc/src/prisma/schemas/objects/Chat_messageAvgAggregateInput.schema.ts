import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Chat_messageAvgAggregateInputType> = z
  .object({
    user_id: z.literal(true).optional(),
  })
  .strict();

export const Chat_messageAvgAggregateInputObjectSchema = Schema;
