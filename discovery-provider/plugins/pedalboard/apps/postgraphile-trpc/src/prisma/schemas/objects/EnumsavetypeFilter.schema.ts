import { z } from 'zod';
import { savetypeSchema } from '../enums/savetype.schema';
import { NestedEnumsavetypeFilterObjectSchema } from './NestedEnumsavetypeFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.EnumsavetypeFilter> = z
  .object({
    equals: z.lazy(() => savetypeSchema).optional(),
    in: z
      .union([
        z.lazy(() => savetypeSchema).array(),
        z.lazy(() => savetypeSchema),
      ])
      .optional(),
    notIn: z
      .union([
        z.lazy(() => savetypeSchema).array(),
        z.lazy(() => savetypeSchema),
      ])
      .optional(),
    not: z
      .union([
        z.lazy(() => savetypeSchema),
        z.lazy(() => NestedEnumsavetypeFilterObjectSchema),
      ])
      .optional(),
  })
  .strict();

export const EnumsavetypeFilterObjectSchema = Schema;
