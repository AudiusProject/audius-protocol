import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.schema_migrationsCreateInput> = z
  .object({
    version: z.string(),
  })
  .strict();

export const schema_migrationsCreateInputObjectSchema = Schema;
