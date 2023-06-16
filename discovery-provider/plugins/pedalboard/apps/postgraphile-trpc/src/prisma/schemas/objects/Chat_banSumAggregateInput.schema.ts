import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Chat_banSumAggregateInputType> = z
  .object({
    user_id: z.literal(true).optional(),
  })
  .strict();

export const Chat_banSumAggregateInputObjectSchema = Schema;
