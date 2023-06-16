import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.BlocksSumAggregateInputType> = z
  .object({
    number: z.literal(true).optional(),
  })
  .strict();

export const BlocksSumAggregateInputObjectSchema = Schema;
