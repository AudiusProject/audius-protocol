import { z } from 'zod';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { StringNullableFilterObjectSchema } from './StringNullableFilter.schema';
import { StringFilterObjectSchema } from './StringFilter.schema';
import { DateTimeFilterObjectSchema } from './DateTimeFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.trending_resultsWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => trending_resultsWhereInputObjectSchema),
        z.lazy(() => trending_resultsWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => trending_resultsWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => trending_resultsWhereInputObjectSchema),
        z.lazy(() => trending_resultsWhereInputObjectSchema).array(),
      ])
      .optional(),
    user_id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    id: z
      .union([z.lazy(() => StringNullableFilterObjectSchema), z.string()])
      .optional()
      .nullable(),
    rank: z.union([z.lazy(() => IntFilterObjectSchema), z.number()]).optional(),
    type: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    version: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    week: z
      .union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()])
      .optional(),
  })
  .strict();

export const trending_resultsWhereInputObjectSchema = Schema;
