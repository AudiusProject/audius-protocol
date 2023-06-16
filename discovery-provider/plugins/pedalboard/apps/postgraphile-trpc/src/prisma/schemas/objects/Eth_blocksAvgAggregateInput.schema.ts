import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Eth_blocksAvgAggregateInputType> = z
  .object({
    last_scanned_block: z.literal(true).optional(),
  })
  .strict();

export const Eth_blocksAvgAggregateInputObjectSchema = Schema;
