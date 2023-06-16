import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Audius_data_txsSumAggregateInputType> = z
  .object({
    slot: z.literal(true).optional(),
  })
  .strict();

export const Audius_data_txsSumAggregateInputObjectSchema = Schema;
