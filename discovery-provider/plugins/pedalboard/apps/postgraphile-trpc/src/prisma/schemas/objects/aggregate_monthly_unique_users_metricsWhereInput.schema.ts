import { z } from 'zod';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { DateTimeFilterObjectSchema } from './DateTimeFilter.schema';
import { IntNullableFilterObjectSchema } from './IntNullableFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_monthly_unique_users_metricsWhereInput> =
  z
    .object({
      AND: z
        .union([
          z.lazy(
            () => aggregate_monthly_unique_users_metricsWhereInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                aggregate_monthly_unique_users_metricsWhereInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      OR: z
        .lazy(
          () => aggregate_monthly_unique_users_metricsWhereInputObjectSchema,
        )
        .array()
        .optional(),
      NOT: z
        .union([
          z.lazy(
            () => aggregate_monthly_unique_users_metricsWhereInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                aggregate_monthly_unique_users_metricsWhereInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      id: z.union([z.lazy(() => IntFilterObjectSchema), z.number()]).optional(),
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
      summed_count: z
        .union([z.lazy(() => IntNullableFilterObjectSchema), z.number()])
        .optional()
        .nullable(),
    })
    .strict();

export const aggregate_monthly_unique_users_metricsWhereInputObjectSchema =
  Schema;
