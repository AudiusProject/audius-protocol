import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.spl_token_backfill_txsCreateInput> = z
  .object({
    signature: z.string(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
  })
  .strict();

export const spl_token_backfill_txsCreateInputObjectSchema = Schema;
