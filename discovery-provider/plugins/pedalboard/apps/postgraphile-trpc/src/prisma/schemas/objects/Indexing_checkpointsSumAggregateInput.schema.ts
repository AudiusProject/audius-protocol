import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Indexing_checkpointsSumAggregateInputType> = z
  .object({
    last_checkpoint: z.literal(true).optional(),
  })
  .strict();

export const Indexing_checkpointsSumAggregateInputObjectSchema = Schema;
