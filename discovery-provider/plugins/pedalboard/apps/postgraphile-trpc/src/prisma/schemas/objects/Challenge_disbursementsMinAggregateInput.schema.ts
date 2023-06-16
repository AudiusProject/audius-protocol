import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Challenge_disbursementsMinAggregateInputType> = z
  .object({
    challenge_id: z.literal(true).optional(),
    user_id: z.literal(true).optional(),
    specifier: z.literal(true).optional(),
    signature: z.literal(true).optional(),
    slot: z.literal(true).optional(),
    amount: z.literal(true).optional(),
  })
  .strict();

export const Challenge_disbursementsMinAggregateInputObjectSchema = Schema;
