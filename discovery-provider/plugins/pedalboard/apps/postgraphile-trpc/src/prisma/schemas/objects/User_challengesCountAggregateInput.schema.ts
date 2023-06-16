import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.User_challengesCountAggregateInputType> = z
  .object({
    challenge_id: z.literal(true).optional(),
    user_id: z.literal(true).optional(),
    specifier: z.literal(true).optional(),
    is_complete: z.literal(true).optional(),
    current_step_count: z.literal(true).optional(),
    completed_blocknumber: z.literal(true).optional(),
    _all: z.literal(true).optional(),
  })
  .strict();

export const User_challengesCountAggregateInputObjectSchema = Schema;
