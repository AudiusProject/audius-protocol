import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.User_bank_backfill_txsAvgAggregateInputType> = z
  .object({
    slot: z.literal(true).optional(),
  })
  .strict();

export const User_bank_backfill_txsAvgAggregateInputObjectSchema = Schema;
