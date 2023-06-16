import { z } from 'zod';
import { IntWithAggregatesFilterObjectSchema } from './IntWithAggregatesFilter.schema';
import { BigIntNullableWithAggregatesFilterObjectSchema } from './BigIntNullableWithAggregatesFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_playsScalarWhereWithAggregatesInput> =
  z
    .object({
      AND: z
        .union([
          z.lazy(
            () => aggregate_playsScalarWhereWithAggregatesInputObjectSchema,
          ),
          z
            .lazy(
              () => aggregate_playsScalarWhereWithAggregatesInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      OR: z
        .lazy(() => aggregate_playsScalarWhereWithAggregatesInputObjectSchema)
        .array()
        .optional(),
      NOT: z
        .union([
          z.lazy(
            () => aggregate_playsScalarWhereWithAggregatesInputObjectSchema,
          ),
          z
            .lazy(
              () => aggregate_playsScalarWhereWithAggregatesInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      play_item_id: z
        .union([z.lazy(() => IntWithAggregatesFilterObjectSchema), z.number()])
        .optional(),
      count: z
        .union([
          z.lazy(() => BigIntNullableWithAggregatesFilterObjectSchema),
          z.bigint(),
        ])
        .optional()
        .nullable(),
    })
    .strict();

export const aggregate_playsScalarWhereWithAggregatesInputObjectSchema = Schema;
