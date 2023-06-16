import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.PubkeysCountAggregateInputType> = z
  .object({
    wallet: z.literal(true).optional(),
    pubkey: z.literal(true).optional(),
    _all: z.literal(true).optional(),
  })
  .strict();

export const PubkeysCountAggregateInputObjectSchema = Schema;
