import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Eth_blocksMaxAggregateInputType> = z
  .object({
    last_scanned_block: z.literal(true).optional(),
    created_at: z.literal(true).optional(),
    updated_at: z.literal(true).optional(),
  })
  .strict();

export const Eth_blocksMaxAggregateInputObjectSchema = Schema;
