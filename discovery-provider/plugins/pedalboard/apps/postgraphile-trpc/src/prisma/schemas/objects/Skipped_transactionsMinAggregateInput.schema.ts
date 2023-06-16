import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Skipped_transactionsMinAggregateInputType> = z
  .object({
    id: z.literal(true).optional(),
    blocknumber: z.literal(true).optional(),
    blockhash: z.literal(true).optional(),
    txhash: z.literal(true).optional(),
    created_at: z.literal(true).optional(),
    updated_at: z.literal(true).optional(),
    level: z.literal(true).optional(),
  })
  .strict();

export const Skipped_transactionsMinAggregateInputObjectSchema = Schema;
