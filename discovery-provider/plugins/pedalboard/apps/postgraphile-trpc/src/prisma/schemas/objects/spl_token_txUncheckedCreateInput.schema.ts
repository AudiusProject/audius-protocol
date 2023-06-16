import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.spl_token_txUncheckedCreateInput> = z
  .object({
    last_scanned_slot: z.number(),
    signature: z.string(),
    created_at: z.coerce.date().optional(),
    updated_at: z.coerce.date().optional(),
  })
  .strict();

export const spl_token_txUncheckedCreateInputObjectSchema = Schema;
