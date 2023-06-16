import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Schema_migrationsMinAggregateInputType> = z
  .object({
    version: z.literal(true).optional(),
  })
  .strict();

export const Schema_migrationsMinAggregateInputObjectSchema = Schema;
