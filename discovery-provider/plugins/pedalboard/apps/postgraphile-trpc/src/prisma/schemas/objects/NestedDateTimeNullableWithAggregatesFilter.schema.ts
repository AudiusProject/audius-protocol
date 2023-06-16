import { z } from 'zod';
import { NestedIntNullableFilterObjectSchema } from './NestedIntNullableFilter.schema';
import { NestedDateTimeNullableFilterObjectSchema } from './NestedDateTimeNullableFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.NestedDateTimeNullableWithAggregatesFilter> = z
  .object({
    equals: z.coerce.date().optional().nullable(),
    in: z
      .union([z.coerce.date().array(), z.coerce.date()])
      .optional()
      .nullable(),
    notIn: z
      .union([z.coerce.date().array(), z.coerce.date()])
      .optional()
      .nullable(),
    lt: z.coerce.date().optional(),
    lte: z.coerce.date().optional(),
    gt: z.coerce.date().optional(),
    gte: z.coerce.date().optional(),
    not: z
      .union([
        z.coerce.date(),
        z.lazy(() => NestedDateTimeNullableWithAggregatesFilterObjectSchema),
      ])
      .optional()
      .nullable(),
    _count: z.lazy(() => NestedIntNullableFilterObjectSchema).optional(),
    _min: z.lazy(() => NestedDateTimeNullableFilterObjectSchema).optional(),
    _max: z.lazy(() => NestedDateTimeNullableFilterObjectSchema).optional(),
  })
  .strict();

export const NestedDateTimeNullableWithAggregatesFilterObjectSchema = Schema;
