import { z } from 'zod';
import { challengetypeSchema } from '../enums/challengetype.schema';
import { NestedIntFilterObjectSchema } from './NestedIntFilter.schema';
import { NestedEnumchallengetypeFilterObjectSchema } from './NestedEnumchallengetypeFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.NestedEnumchallengetypeWithAggregatesFilter> = z
  .object({
    equals: z.lazy(() => challengetypeSchema).optional(),
    in: z
      .union([
        z.lazy(() => challengetypeSchema).array(),
        z.lazy(() => challengetypeSchema),
      ])
      .optional(),
    notIn: z
      .union([
        z.lazy(() => challengetypeSchema).array(),
        z.lazy(() => challengetypeSchema),
      ])
      .optional(),
    not: z
      .union([
        z.lazy(() => challengetypeSchema),
        z.lazy(() => NestedEnumchallengetypeWithAggregatesFilterObjectSchema),
      ])
      .optional(),
    _count: z.lazy(() => NestedIntFilterObjectSchema).optional(),
    _min: z.lazy(() => NestedEnumchallengetypeFilterObjectSchema).optional(),
    _max: z.lazy(() => NestedEnumchallengetypeFilterObjectSchema).optional(),
  })
  .strict();

export const NestedEnumchallengetypeWithAggregatesFilterObjectSchema = Schema;
