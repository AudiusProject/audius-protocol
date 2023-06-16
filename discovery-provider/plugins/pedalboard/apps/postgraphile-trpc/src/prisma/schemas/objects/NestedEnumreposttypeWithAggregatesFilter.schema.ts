import { z } from 'zod';
import { reposttypeSchema } from '../enums/reposttype.schema';
import { NestedIntFilterObjectSchema } from './NestedIntFilter.schema';
import { NestedEnumreposttypeFilterObjectSchema } from './NestedEnumreposttypeFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.NestedEnumreposttypeWithAggregatesFilter> = z
  .object({
    equals: z.lazy(() => reposttypeSchema).optional(),
    in: z
      .union([
        z.lazy(() => reposttypeSchema).array(),
        z.lazy(() => reposttypeSchema),
      ])
      .optional(),
    notIn: z
      .union([
        z.lazy(() => reposttypeSchema).array(),
        z.lazy(() => reposttypeSchema),
      ])
      .optional(),
    not: z
      .union([
        z.lazy(() => reposttypeSchema),
        z.lazy(() => NestedEnumreposttypeWithAggregatesFilterObjectSchema),
      ])
      .optional(),
    _count: z.lazy(() => NestedIntFilterObjectSchema).optional(),
    _min: z.lazy(() => NestedEnumreposttypeFilterObjectSchema).optional(),
    _max: z.lazy(() => NestedEnumreposttypeFilterObjectSchema).optional(),
  })
  .strict();

export const NestedEnumreposttypeWithAggregatesFilterObjectSchema = Schema;
