import { z } from 'zod';
import { delist_track_reasonSchema } from '../enums/delist_track_reason.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.NestedEnumdelist_track_reasonFilter> = z
  .object({
    equals: z.lazy(() => delist_track_reasonSchema).optional(),
    in: z
      .union([
        z.lazy(() => delist_track_reasonSchema).array(),
        z.lazy(() => delist_track_reasonSchema),
      ])
      .optional(),
    notIn: z
      .union([
        z.lazy(() => delist_track_reasonSchema).array(),
        z.lazy(() => delist_track_reasonSchema),
      ])
      .optional(),
    not: z
      .union([
        z.lazy(() => delist_track_reasonSchema),
        z.lazy(() => NestedEnumdelist_track_reasonFilterObjectSchema),
      ])
      .optional(),
  })
  .strict();

export const NestedEnumdelist_track_reasonFilterObjectSchema = Schema;
