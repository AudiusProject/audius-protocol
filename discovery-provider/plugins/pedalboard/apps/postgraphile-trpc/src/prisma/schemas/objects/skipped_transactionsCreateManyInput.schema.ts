import { z } from 'zod';
import { skippedtransactionlevelSchema } from '../enums/skippedtransactionlevel.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.skipped_transactionsCreateManyInput> = z
  .object({
    id: z.number().optional(),
    blocknumber: z.number(),
    blockhash: z.string(),
    txhash: z.string(),
    created_at: z.coerce.date().optional(),
    updated_at: z.coerce.date().optional(),
    level: z
      .lazy(() => skippedtransactionlevelSchema)
      .optional()
      .nullable(),
  })
  .strict();

export const skipped_transactionsCreateManyInputObjectSchema = Schema;
