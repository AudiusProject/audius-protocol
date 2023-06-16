import { z } from 'zod';
import { skippedtransactionlevelSchema } from '../enums/skippedtransactionlevel.schema';
import { NestedEnumskippedtransactionlevelNullableFilterObjectSchema } from './NestedEnumskippedtransactionlevelNullableFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.EnumskippedtransactionlevelNullableFilter> = z
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
          () => NestedEnumskippedtransactionlevelNullableFilterObjectSchema,
        ),
      ])
      .optional()
      .nullable(),
  })
  .strict();

export const EnumskippedtransactionlevelNullableFilterObjectSchema = Schema;
