import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.User_challengesSumAggregateInputType> = z
  .object({
    user_id: z.literal(true).optional(),
    current_step_count: z.literal(true).optional(),
    completed_blocknumber: z.literal(true).optional(),
  })
  .strict();

export const User_challengesSumAggregateInputObjectSchema = Schema;
