import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_bank_backfill_txsCreateInput> = z
  .object({
    signature: z.string(),
    slot: z.number(),
    created_at: z.coerce.date(),
  })
  .strict();

export const user_bank_backfill_txsCreateInputObjectSchema = Schema;
