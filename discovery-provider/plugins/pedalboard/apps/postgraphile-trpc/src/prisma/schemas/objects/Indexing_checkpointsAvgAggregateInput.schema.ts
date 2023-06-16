import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Indexing_checkpointsAvgAggregateInputType> = z
  .object({
    last_checkpoint: z.literal(true).optional(),
  })
  .strict();

export const Indexing_checkpointsAvgAggregateInputObjectSchema = Schema;
