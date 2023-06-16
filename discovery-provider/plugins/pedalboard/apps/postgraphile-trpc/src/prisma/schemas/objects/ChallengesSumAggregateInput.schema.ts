import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.ChallengesSumAggregateInputType> = z
  .object({
    step_count: z.literal(true).optional(),
    starting_block: z.literal(true).optional(),
  })
  .strict();

export const ChallengesSumAggregateInputObjectSchema = Schema;
