import { z } from 'zod';
import { delist_entitySchema } from '../enums/delist_entity.schema';
import { NestedIntFilterObjectSchema } from './NestedIntFilter.schema';
import { NestedEnumdelist_entityFilterObjectSchema } from './NestedEnumdelist_entityFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.NestedEnumdelist_entityWithAggregatesFilter> = z
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
        z.lazy(() => NestedEnumdelist_entityWithAggregatesFilterObjectSchema),
      ])
      .optional(),
    _count: z.lazy(() => NestedIntFilterObjectSchema).optional(),
    _min: z.lazy(() => NestedEnumdelist_entityFilterObjectSchema).optional(),
    _max: z.lazy(() => NestedEnumdelist_entityFilterObjectSchema).optional(),
  })
  .strict();

export const NestedEnumdelist_entityWithAggregatesFilterObjectSchema = Schema;
