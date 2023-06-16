import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.NestedBoolNullableFilter> = z
  .object({
    equals: z.boolean().optional().nullable(),
    not: z
      .union([z.boolean(), z.lazy(() => NestedBoolNullableFilterObjectSchema)])
      .optional()
      .nullable(),
  })
  .strict();

export const NestedBoolNullableFilterObjectSchema = Schema;
