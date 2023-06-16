import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.BlocksMaxAggregateInputType> = z
  .object({
    blockhash: z.literal(true).optional(),
    parenthash: z.literal(true).optional(),
    is_current: z.literal(true).optional(),
    number: z.literal(true).optional(),
  })
  .strict();

export const BlocksMaxAggregateInputObjectSchema = Schema;
