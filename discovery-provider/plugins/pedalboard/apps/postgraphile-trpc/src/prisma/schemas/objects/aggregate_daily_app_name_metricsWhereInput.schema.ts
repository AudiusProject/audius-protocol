import { z } from 'zod';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { StringFilterObjectSchema } from './StringFilter.schema';
import { DateTimeFilterObjectSchema } from './DateTimeFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_daily_app_name_metricsWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => aggregate_daily_app_name_metricsWhereInputObjectSchema),
        z
          .lazy(() => aggregate_daily_app_name_metricsWhereInputObjectSchema)
          .array(),
      ])
      .optional(),
    OR: z
      .lazy(() => aggregate_daily_app_name_metricsWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => aggregate_daily_app_name_metricsWhereInputObjectSchema),
        z
          .lazy(() => aggregate_daily_app_name_metricsWhereInputObjectSchema)
          .array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => IntFilterObjectSchema), z.number()]).optional(),
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
  })
  .strict();

export const aggregate_daily_app_name_metricsWhereInputObjectSchema = Schema;
