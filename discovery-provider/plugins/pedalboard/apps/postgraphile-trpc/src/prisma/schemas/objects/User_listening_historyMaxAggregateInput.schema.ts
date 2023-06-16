import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.User_listening_historyMaxAggregateInputType> = z
  .object({
    user_id: z.literal(true).optional(),
  })
  .strict();

export const User_listening_historyMaxAggregateInputObjectSchema = Schema;
