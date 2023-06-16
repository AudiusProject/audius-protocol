import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.PubkeysMaxAggregateInputType> = z
  .object({
    wallet: z.literal(true).optional(),
    pubkey: z.literal(true).optional(),
  })
  .strict();

export const PubkeysMaxAggregateInputObjectSchema = Schema;
