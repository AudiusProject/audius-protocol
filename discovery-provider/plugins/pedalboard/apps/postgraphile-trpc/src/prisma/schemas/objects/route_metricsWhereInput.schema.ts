import { z } from 'zod';
import { StringFilterObjectSchema } from './StringFilter.schema';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { DateTimeFilterObjectSchema } from './DateTimeFilter.schema';
import { BigIntFilterObjectSchema } from './BigIntFilter.schema';
import { StringNullableFilterObjectSchema } from './StringNullableFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.route_metricsWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => route_metricsWhereInputObjectSchema),
        z.lazy(() => route_metricsWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => route_metricsWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => route_metricsWhereInputObjectSchema),
        z.lazy(() => route_metricsWhereInputObjectSchema).array(),
      ])
      .optional(),
    route_path: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    version: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    query_string: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    count: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    timestamp: z
      .union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()])
      .optional(),
    created_at: z
      .union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()])
      .optional(),
    updated_at: z
      .union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()])
      .optional(),
    id: z
      .union([z.lazy(() => BigIntFilterObjectSchema), z.bigint()])
      .optional(),
    ip: z
      .union([z.lazy(() => StringNullableFilterObjectSchema), z.string()])
      .optional()
      .nullable(),
  })
  .strict();

export const route_metricsWhereInputObjectSchema = Schema;
