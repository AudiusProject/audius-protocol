import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Spl_token_txCountAggregateInputType> = z
  .object({
    last_scanned_slot: z.literal(true).optional(),
    signature: z.literal(true).optional(),
    created_at: z.literal(true).optional(),
    updated_at: z.literal(true).optional(),
    _all: z.literal(true).optional(),
  })
  .strict();

export const Spl_token_txCountAggregateInputObjectSchema = Schema;
