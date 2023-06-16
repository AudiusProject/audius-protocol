import { z } from 'zod';
import { challengetypeSchema } from '../enums/challengetype.schema';
import { NestedEnumchallengetypeFilterObjectSchema } from './NestedEnumchallengetypeFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.EnumchallengetypeFilter> = z
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
        z.lazy(() => NestedEnumchallengetypeFilterObjectSchema),
      ])
      .optional(),
  })
  .strict();

export const EnumchallengetypeFilterObjectSchema = Schema;
