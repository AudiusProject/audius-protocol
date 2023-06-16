import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Indexing_checkpointsMaxAggregateInputType> = z
  .object({
    tablename: z.literal(true).optional(),
    last_checkpoint: z.literal(true).optional(),
    signature: z.literal(true).optional(),
  })
  .strict();

export const Indexing_checkpointsMaxAggregateInputObjectSchema = Schema;
