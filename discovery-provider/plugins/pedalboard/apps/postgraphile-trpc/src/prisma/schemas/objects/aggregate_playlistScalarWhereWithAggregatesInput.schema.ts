import { z } from 'zod';
import { IntWithAggregatesFilterObjectSchema } from './IntWithAggregatesFilter.schema';
import { BoolNullableWithAggregatesFilterObjectSchema } from './BoolNullableWithAggregatesFilter.schema';
import { IntNullableWithAggregatesFilterObjectSchema } from './IntNullableWithAggregatesFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_playlistScalarWhereWithAggregatesInput> =
  z
    .object({
      AND: z
        .union([
          z.lazy(
            () => aggregate_playlistScalarWhereWithAggregatesInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                aggregate_playlistScalarWhereWithAggregatesInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      OR: z
        .lazy(
          () => aggregate_playlistScalarWhereWithAggregatesInputObjectSchema,
        )
        .array()
        .optional(),
      NOT: z
        .union([
          z.lazy(
            () => aggregate_playlistScalarWhereWithAggregatesInputObjectSchema,
          ),
          z
            .lazy(
              () =>
                aggregate_playlistScalarWhereWithAggregatesInputObjectSchema,
            )
            .array(),
        ])
        .optional(),
      playlist_id: z
        .union([z.lazy(() => IntWithAggregatesFilterObjectSchema), z.number()])
        .optional(),
      is_album: z
        .union([
          z.lazy(() => BoolNullableWithAggregatesFilterObjectSchema),
          z.boolean(),
        ])
        .optional()
        .nullable(),
      repost_count: z
        .union([
          z.lazy(() => IntNullableWithAggregatesFilterObjectSchema),
          z.number(),
        ])
        .optional()
        .nullable(),
      save_count: z
        .union([
          z.lazy(() => IntNullableWithAggregatesFilterObjectSchema),
          z.number(),
        ])
        .optional()
        .nullable(),
    })
    .strict();

export const aggregate_playlistScalarWhereWithAggregatesInputObjectSchema =
  Schema;
