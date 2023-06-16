import { z } from 'zod';
import { StringFilterObjectSchema } from './StringFilter.schema';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { StringNullableFilterObjectSchema } from './StringNullableFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.indexing_checkpointsWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => indexing_checkpointsWhereInputObjectSchema),
        z.lazy(() => indexing_checkpointsWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => indexing_checkpointsWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => indexing_checkpointsWhereInputObjectSchema),
        z.lazy(() => indexing_checkpointsWhereInputObjectSchema).array(),
      ])
      .optional(),
    tablename: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    last_checkpoint: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    signature: z
      .union([z.lazy(() => StringNullableFilterObjectSchema), z.string()])
      .optional()
      .nullable(),
  })
  .strict();

export const indexing_checkpointsWhereInputObjectSchema = Schema;
