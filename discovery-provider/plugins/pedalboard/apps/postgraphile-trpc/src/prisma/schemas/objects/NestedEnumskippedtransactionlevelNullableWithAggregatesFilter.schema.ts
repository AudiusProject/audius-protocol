import { z } from 'zod';
import { skippedtransactionlevelSchema } from '../enums/skippedtransactionlevel.schema';
import { NestedIntNullableFilterObjectSchema } from './NestedIntNullableFilter.schema';
import { NestedEnumskippedtransactionlevelNullableFilterObjectSchema } from './NestedEnumskippedtransactionlevelNullableFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.NestedEnumskippedtransactionlevelNullableWithAggregatesFilter> =
  z
    .object({
      equals: z
        .lazy(() => skippedtransactionlevelSchema)
        .optional()
        .nullable(),
      in: z
        .union([
          z.lazy(() => skippedtransactionlevelSchema).array(),
          z.lazy(() => skippedtransactionlevelSchema),
        ])
        .optional()
        .nullable(),
      notIn: z
        .union([
          z.lazy(() => skippedtransactionlevelSchema).array(),
          z.lazy(() => skippedtransactionlevelSchema),
        ])
        .optional()
        .nullable(),
      not: z
        .union([
          z.lazy(() => skippedtransactionlevelSchema),
          z.lazy(
            () =>
              NestedEnumskippedtransactionlevelNullableWithAggregatesFilterObjectSchema,
          ),
        ])
        .optional()
        .nullable(),
      _count: z.lazy(() => NestedIntNullableFilterObjectSchema).optional(),
      _min: z
        .lazy(() => NestedEnumskippedtransactionlevelNullableFilterObjectSchema)
        .optional(),
      _max: z
        .lazy(() => NestedEnumskippedtransactionlevelNullableFilterObjectSchema)
        .optional(),
    })
    .strict();

export const NestedEnumskippedtransactionlevelNullableWithAggregatesFilterObjectSchema =
  Schema;
