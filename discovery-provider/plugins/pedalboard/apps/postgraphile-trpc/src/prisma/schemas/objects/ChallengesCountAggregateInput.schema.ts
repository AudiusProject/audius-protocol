import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.ChallengesCountAggregateInputType> = z
  .object({
    id: z.literal(true).optional(),
    type: z.literal(true).optional(),
    amount: z.literal(true).optional(),
    active: z.literal(true).optional(),
    step_count: z.literal(true).optional(),
    starting_block: z.literal(true).optional(),
    _all: z.literal(true).optional(),
  })
  .strict();

export const ChallengesCountAggregateInputObjectSchema = Schema;
