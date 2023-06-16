import { z } from 'zod';
import { IntWithAggregatesFilterObjectSchema } from './IntWithAggregatesFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.stemsScalarWhereWithAggregatesInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => stemsScalarWhereWithAggregatesInputObjectSchema),
        z.lazy(() => stemsScalarWhereWithAggregatesInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => stemsScalarWhereWithAggregatesInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => stemsScalarWhereWithAggregatesInputObjectSchema),
        z.lazy(() => stemsScalarWhereWithAggregatesInputObjectSchema).array(),
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

export const stemsScalarWhereWithAggregatesInputObjectSchema = Schema;
