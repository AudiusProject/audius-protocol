import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Challenge_profile_completionAvgAggregateInputType> =
  z
    .object({
      user_id: z.literal(true).optional(),
    })
    .strict();

export const Challenge_profile_completionAvgAggregateInputObjectSchema = Schema;
