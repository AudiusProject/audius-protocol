import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Spl_token_txAvgAggregateInputType> = z
  .object({
    last_scanned_slot: z.literal(true).optional(),
  })
  .strict();

export const Spl_token_txAvgAggregateInputObjectSchema = Schema;
