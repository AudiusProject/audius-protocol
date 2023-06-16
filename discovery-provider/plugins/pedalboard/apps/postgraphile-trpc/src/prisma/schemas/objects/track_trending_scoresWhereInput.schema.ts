import { z } from 'zod';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { StringFilterObjectSchema } from './StringFilter.schema';
import { StringNullableFilterObjectSchema } from './StringNullableFilter.schema';
import { FloatFilterObjectSchema } from './FloatFilter.schema';
import { DateTimeFilterObjectSchema } from './DateTimeFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.track_trending_scoresWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => track_trending_scoresWhereInputObjectSchema),
        z.lazy(() => track_trending_scoresWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => track_trending_scoresWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => track_trending_scoresWhereInputObjectSchema),
        z.lazy(() => track_trending_scoresWhereInputObjectSchema).array(),
      ])
      .optional(),
    track_id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    type: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    genre: z
      .union([z.lazy(() => StringNullableFilterObjectSchema), z.string()])
      .optional()
      .nullable(),
    version: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    time_range: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    score: z
      .union([z.lazy(() => FloatFilterObjectSchema), z.number()])
      .optional(),
    created_at: z
      .union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()])
      .optional(),
  })
  .strict();

export const track_trending_scoresWhereInputObjectSchema = Schema;
