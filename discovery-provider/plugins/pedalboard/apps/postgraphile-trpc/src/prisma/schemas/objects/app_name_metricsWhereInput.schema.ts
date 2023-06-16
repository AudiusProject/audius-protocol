import { z } from 'zod';
import { StringFilterObjectSchema } from './StringFilter.schema';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { DateTimeFilterObjectSchema } from './DateTimeFilter.schema';
import { BigIntFilterObjectSchema } from './BigIntFilter.schema';
import { StringNullableFilterObjectSchema } from './StringNullableFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.app_name_metricsWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => app_name_metricsWhereInputObjectSchema),
        z.lazy(() => app_name_metricsWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => app_name_metricsWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => app_name_metricsWhereInputObjectSchema),
        z.lazy(() => app_name_metricsWhereInputObjectSchema).array(),
      ])
      .optional(),
    application_name: z
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

export const app_name_metricsWhereInputObjectSchema = Schema;
