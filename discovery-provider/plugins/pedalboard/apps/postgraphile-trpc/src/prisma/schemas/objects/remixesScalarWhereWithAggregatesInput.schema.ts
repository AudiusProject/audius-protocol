import { z } from 'zod';
import { IntWithAggregatesFilterObjectSchema } from './IntWithAggregatesFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.remixesScalarWhereWithAggregatesInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => remixesScalarWhereWithAggregatesInputObjectSchema),
        z.lazy(() => remixesScalarWhereWithAggregatesInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => remixesScalarWhereWithAggregatesInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => remixesScalarWhereWithAggregatesInputObjectSchema),
        z.lazy(() => remixesScalarWhereWithAggregatesInputObjectSchema).array(),
      ])
      .optional(),
    parent_track_id: z
      .union([z.lazy(() => IntWithAggregatesFilterObjectSchema), z.number()])
      .optional(),
    child_track_id: z
      .union([z.lazy(() => IntWithAggregatesFilterObjectSchema), z.number()])
      .optional(),
  })
  .strict();

export const remixesScalarWhereWithAggregatesInputObjectSchema = Schema;
