import { z } from 'zod';
import { savetypeSchema } from '../enums/savetype.schema';
import { NestedEnumsavetypeWithAggregatesFilterObjectSchema } from './NestedEnumsavetypeWithAggregatesFilter.schema';
import { NestedIntFilterObjectSchema } from './NestedIntFilter.schema';
import { NestedEnumsavetypeFilterObjectSchema } from './NestedEnumsavetypeFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.EnumsavetypeWithAggregatesFilter> = z
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
        z.lazy(() => NestedEnumsavetypeWithAggregatesFilterObjectSchema),
      ])
      .optional(),
    _count: z.lazy(() => NestedIntFilterObjectSchema).optional(),
    _min: z.lazy(() => NestedEnumsavetypeFilterObjectSchema).optional(),
    _max: z.lazy(() => NestedEnumsavetypeFilterObjectSchema).optional(),
  })
  .strict();

export const EnumsavetypeWithAggregatesFilterObjectSchema = Schema;
