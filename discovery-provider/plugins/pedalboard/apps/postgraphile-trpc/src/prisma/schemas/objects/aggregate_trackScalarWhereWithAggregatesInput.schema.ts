import { z } from 'zod';
import { IntWithAggregatesFilterObjectSchema } from './IntWithAggregatesFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_trackScalarWhereWithAggregatesInput> =
  z
    .object({
      AND: z
        .union([
          z.lazy(
            () => aggregate_trackScalarWhereWithAggregatesInputObjectSchema,
          ),
          z
            .lazy(
              () => aggregate_trackScalarWhereWithAggregatesInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      OR: z
        .lazy(() => aggregate_trackScalarWhereWithAggregatesInputObjectSchema)
        .array()
        .optional(),
      NOT: z
        .union([
          z.lazy(
            () => aggregate_trackScalarWhereWithAggregatesInputObjectSchema,
          ),
          z
            .lazy(
              () => aggregate_trackScalarWhereWithAggregatesInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      track_id: z
        .union([z.lazy(() => IntWithAggregatesFilterObjectSchema), z.number()])
        .optional(),
      repost_count: z
        .union([z.lazy(() => IntWithAggregatesFilterObjectSchema), z.number()])
        .optional(),
      save_count: z
        .union([z.lazy(() => IntWithAggregatesFilterObjectSchema), z.number()])
        .optional(),
    })
    .strict();

export const aggregate_trackScalarWhereWithAggregatesInputObjectSchema = Schema;
