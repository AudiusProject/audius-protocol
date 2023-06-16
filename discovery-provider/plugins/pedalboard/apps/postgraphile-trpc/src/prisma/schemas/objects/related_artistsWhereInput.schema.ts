import { z } from 'zod';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { FloatFilterObjectSchema } from './FloatFilter.schema';
import { DateTimeFilterObjectSchema } from './DateTimeFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.related_artistsWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => related_artistsWhereInputObjectSchema),
        z.lazy(() => related_artistsWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => related_artistsWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => related_artistsWhereInputObjectSchema),
        z.lazy(() => related_artistsWhereInputObjectSchema).array(),
      ])
      .optional(),
    user_id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    related_artist_user_id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    score: z
      .union([z.lazy(() => FloatFilterObjectSchema), z.number()])
      .optional(),
    created_at: z
      .union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()])
      .optional(),
  })
  .strict();

export const related_artistsWhereInputObjectSchema = Schema;
