import { z } from 'zod';
import { StringFilterObjectSchema } from './StringFilter.schema';
import { StringNullableFilterObjectSchema } from './StringNullableFilter.schema';
import { DateTimeFilterObjectSchema } from './DateTimeFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.schema_versionWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => schema_versionWhereInputObjectSchema),
        z.lazy(() => schema_versionWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => schema_versionWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => schema_versionWhereInputObjectSchema),
        z.lazy(() => schema_versionWhereInputObjectSchema).array(),
      ])
      .optional(),
    file_name: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    md5: z
      .union([z.lazy(() => StringNullableFilterObjectSchema), z.string()])
      .optional()
      .nullable(),
    applied_at: z
      .union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()])
      .optional(),
  })
  .strict();

export const schema_versionWhereInputObjectSchema = Schema;
