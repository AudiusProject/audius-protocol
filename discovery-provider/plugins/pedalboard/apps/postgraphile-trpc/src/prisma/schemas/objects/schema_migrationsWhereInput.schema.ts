import { z } from 'zod';
import { StringFilterObjectSchema } from './StringFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.schema_migrationsWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => schema_migrationsWhereInputObjectSchema),
        z.lazy(() => schema_migrationsWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => schema_migrationsWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => schema_migrationsWhereInputObjectSchema),
        z.lazy(() => schema_migrationsWhereInputObjectSchema).array(),
      ])
      .optional(),
    version: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
  })
  .strict();

export const schema_migrationsWhereInputObjectSchema = Schema;
