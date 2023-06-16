import { z } from 'zod';
import { StringFilterObjectSchema } from './StringFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.alembic_versionWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => alembic_versionWhereInputObjectSchema),
        z.lazy(() => alembic_versionWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => alembic_versionWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => alembic_versionWhereInputObjectSchema),
        z.lazy(() => alembic_versionWhereInputObjectSchema).array(),
      ])
      .optional(),
    version_num: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
  })
  .strict();

export const alembic_versionWhereInputObjectSchema = Schema;
