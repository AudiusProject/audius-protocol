import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Challenge_disbursementsSumAggregateInputType> = z
  .object({
    user_id: z.literal(true).optional(),
    slot: z.literal(true).optional(),
  })
  .strict();

export const Challenge_disbursementsSumAggregateInputObjectSchema = Schema;
