import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.audio_transactions_historyUncheckedCreateInput> =
  z
    .object({
      user_bank: z.string(),
      slot: z.number(),
      signature: z.string(),
      transaction_type: z.string(),
      method: z.string(),
      created_at: z.coerce.date().optional(),
      updated_at: z.coerce.date().optional(),
      transaction_created_at: z.coerce.date(),
      change: z.number(),
      balance: z.number(),
      tx_metadata: z.string().optional().nullable(),
    })
    .strict();

export const audio_transactions_historyUncheckedCreateInputObjectSchema =
  Schema;
