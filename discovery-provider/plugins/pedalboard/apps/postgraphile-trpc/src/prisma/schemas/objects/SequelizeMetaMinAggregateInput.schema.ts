import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.SequelizeMetaMinAggregateInputType> = z
  .object({
    name: z.literal(true).optional(),
  })
  .strict();

export const SequelizeMetaMinAggregateInputObjectSchema = Schema;
