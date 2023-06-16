import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.SequelizeMetaCountAggregateInputType> = z
  .object({
    name: z.literal(true).optional(),
    _all: z.literal(true).optional(),
  })
  .strict();

export const SequelizeMetaCountAggregateInputObjectSchema = Schema;
