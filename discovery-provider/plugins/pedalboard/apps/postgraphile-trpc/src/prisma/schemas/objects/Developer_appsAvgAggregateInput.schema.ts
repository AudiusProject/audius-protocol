import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Developer_appsAvgAggregateInputType> = z
  .object({
    blocknumber: z.literal(true).optional(),
    user_id: z.literal(true).optional(),
  })
  .strict();

export const Developer_appsAvgAggregateInputObjectSchema = Schema;
