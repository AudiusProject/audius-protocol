import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Skipped_transactionsAvgAggregateInputType> = z
  .object({
    id: z.literal(true).optional(),
    blocknumber: z.literal(true).optional(),
  })
  .strict();

export const Skipped_transactionsAvgAggregateInputObjectSchema = Schema;
