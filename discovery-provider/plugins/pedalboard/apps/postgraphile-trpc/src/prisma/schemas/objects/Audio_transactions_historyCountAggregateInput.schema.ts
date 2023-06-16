import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Audio_transactions_historyCountAggregateInputType> =
  z
    .object({
      user_bank: z.literal(true).optional(),
      slot: z.literal(true).optional(),
      signature: z.literal(true).optional(),
      transaction_type: z.literal(true).optional(),
      method: z.literal(true).optional(),
      created_at: z.literal(true).optional(),
      updated_at: z.literal(true).optional(),
      transaction_created_at: z.literal(true).optional(),
      change: z.literal(true).optional(),
      balance: z.literal(true).optional(),
      tx_metadata: z.literal(true).optional(),
      _all: z.literal(true).optional(),
    })
    .strict();

export const Audio_transactions_historyCountAggregateInputObjectSchema = Schema;
