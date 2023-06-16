import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.schema_migrationsWhereUniqueInput> = z
  .object({
    version: z.string().optional(),
  })
  .strict();

export const schema_migrationsWhereUniqueInputObjectSchema = Schema;
