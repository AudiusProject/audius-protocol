import { z } from 'zod';
import { IntWithAggregatesFilterObjectSchema } from './IntWithAggregatesFilter.schema';
import { BigIntNullableWithAggregatesFilterObjectSchema } from './BigIntNullableWithAggregatesFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_userScalarWhereWithAggregatesInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => aggregate_userScalarWhereWithAggregatesInputObjectSchema),
        z
          .lazy(() => aggregate_userScalarWhereWithAggregatesInputObjectSchema)
          .array(),
      ])
      .optional(),
    OR: z
      .lazy(() => aggregate_userScalarWhereWithAggregatesInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => aggregate_userScalarWhereWithAggregatesInputObjectSchema),
        z
          .lazy(() => aggregate_userScalarWhereWithAggregatesInputObjectSchema)
          .array(),
      ])
      .optional(),
    user_id: z
      .union([z.lazy(() => IntWithAggregatesFilterObjectSchema), z.number()])
      .optional(),
    track_count: z
      .union([
        z.lazy(() => BigIntNullableWithAggregatesFilterObjectSchema),
        z.bigint(),
      ])
      .optional()
      .nullable(),
    playlist_count: z
      .union([
        z.lazy(() => BigIntNullableWithAggregatesFilterObjectSchema),
        z.bigint(),
      ])
      .optional()
      .nullable(),
    album_count: z
      .union([
        z.lazy(() => BigIntNullableWithAggregatesFilterObjectSchema),
        z.bigint(),
      ])
      .optional()
      .nullable(),
    follower_count: z
      .union([
        z.lazy(() => BigIntNullableWithAggregatesFilterObjectSchema),
        z.bigint(),
      ])
      .optional()
      .nullable(),
    following_count: z
      .union([
        z.lazy(() => BigIntNullableWithAggregatesFilterObjectSchema),
        z.bigint(),
      ])
      .optional()
      .nullable(),
    repost_count: z
      .union([
        z.lazy(() => BigIntNullableWithAggregatesFilterObjectSchema),
        z.bigint(),
      ])
      .optional()
      .nullable(),
    track_save_count: z
      .union([
        z.lazy(() => BigIntNullableWithAggregatesFilterObjectSchema),
        z.bigint(),
      ])
      .optional()
      .nullable(),
    supporter_count: z
      .union([z.lazy(() => IntWithAggregatesFilterObjectSchema), z.number()])
      .optional(),
    supporting_count: z
      .union([z.lazy(() => IntWithAggregatesFilterObjectSchema), z.number()])
      .optional(),
  })
  .strict();

export const aggregate_userScalarWhereWithAggregatesInputObjectSchema = Schema;
