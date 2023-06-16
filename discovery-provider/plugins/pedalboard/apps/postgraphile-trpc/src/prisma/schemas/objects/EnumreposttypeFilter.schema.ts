import { z } from 'zod';
import { reposttypeSchema } from '../enums/reposttype.schema';
import { NestedEnumreposttypeFilterObjectSchema } from './NestedEnumreposttypeFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.EnumreposttypeFilter> = z
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
        z.lazy(() => NestedEnumreposttypeFilterObjectSchema),
      ])
      .optional(),
  })
  .strict();

export const EnumreposttypeFilterObjectSchema = Schema;
