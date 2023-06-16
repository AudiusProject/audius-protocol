import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.indexing_checkpointsWhereUniqueInput> = z
  .object({
    tablename: z.string().optional(),
  })
  .strict();

export const indexing_checkpointsWhereUniqueInputObjectSchema = Schema;
