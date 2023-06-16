import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Cid_dataCountAggregateInputType> = z
  .object({
    cid: z.literal(true).optional(),
    type: z.literal(true).optional(),
    data: z.literal(true).optional(),
    _all: z.literal(true).optional(),
  })
  .strict();

export const Cid_dataCountAggregateInputObjectSchema = Schema;
