import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Audio_transactions_historyAvgAggregateInputType> =
  z
    .object({
      slot: z.literal(true).optional(),
      change: z.literal(true).optional(),
      balance: z.literal(true).optional(),
    })
    .strict();

export const Audio_transactions_historyAvgAggregateInputObjectSchema = Schema;
