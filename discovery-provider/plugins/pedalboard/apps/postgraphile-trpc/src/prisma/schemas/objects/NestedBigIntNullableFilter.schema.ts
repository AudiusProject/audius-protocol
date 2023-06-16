import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.NestedBigIntNullableFilter> = z
  .object({
    equals: z.bigint().optional().nullable(),
    in: z.union([z.bigint().array(), z.bigint()]).optional().nullable(),
    notIn: z.union([z.bigint().array(), z.bigint()]).optional().nullable(),
    lt: z.bigint().optional(),
    lte: z.bigint().optional(),
    gt: z.bigint().optional(),
    gte: z.bigint().optional(),
    not: z
      .union([z.bigint(), z.lazy(() => NestedBigIntNullableFilterObjectSchema)])
      .optional()
      .nullable(),
  })
  .strict();

export const NestedBigIntNullableFilterObjectSchema = Schema;
