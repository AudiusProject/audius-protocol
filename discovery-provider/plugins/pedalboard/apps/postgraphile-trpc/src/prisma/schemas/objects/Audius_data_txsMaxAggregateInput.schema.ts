import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Audius_data_txsMaxAggregateInputType> = z
  .object({
    signature: z.literal(true).optional(),
    slot: z.literal(true).optional(),
  })
  .strict();

export const Audius_data_txsMaxAggregateInputObjectSchema = Schema;
