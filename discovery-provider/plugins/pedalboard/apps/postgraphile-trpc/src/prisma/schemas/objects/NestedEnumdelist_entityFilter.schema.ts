import { z } from 'zod';
import { delist_entitySchema } from '../enums/delist_entity.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.NestedEnumdelist_entityFilter> = z
  .object({
    equals: z.lazy(() => delist_entitySchema).optional(),
    in: z
      .union([
        z.lazy(() => delist_entitySchema).array(),
        z.lazy(() => delist_entitySchema),
      ])
      .optional(),
    notIn: z
      .union([
        z.lazy(() => delist_entitySchema).array(),
        z.lazy(() => delist_entitySchema),
      ])
      .optional(),
    not: z
      .union([
        z.lazy(() => delist_entitySchema),
        z.lazy(() => NestedEnumdelist_entityFilterObjectSchema),
      ])
      .optional(),
  })
  .strict();

export const NestedEnumdelist_entityFilterObjectSchema = Schema;
