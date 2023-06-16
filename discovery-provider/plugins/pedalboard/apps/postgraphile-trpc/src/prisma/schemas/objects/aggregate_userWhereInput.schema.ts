import { z } from 'zod';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { BigIntNullableFilterObjectSchema } from './BigIntNullableFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_userWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => aggregate_userWhereInputObjectSchema),
        z.lazy(() => aggregate_userWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => aggregate_userWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => aggregate_userWhereInputObjectSchema),
        z.lazy(() => aggregate_userWhereInputObjectSchema).array(),
      ])
      .optional(),
    user_id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    track_count: z
      .union([z.lazy(() => BigIntNullableFilterObjectSchema), z.bigint()])
      .optional()
      .nullable(),
    playlist_count: z
      .union([z.lazy(() => BigIntNullableFilterObjectSchema), z.bigint()])
      .optional()
      .nullable(),
    album_count: z
      .union([z.lazy(() => BigIntNullableFilterObjectSchema), z.bigint()])
      .optional()
      .nullable(),
    follower_count: z
      .union([z.lazy(() => BigIntNullableFilterObjectSchema), z.bigint()])
      .optional()
      .nullable(),
    following_count: z
      .union([z.lazy(() => BigIntNullableFilterObjectSchema), z.bigint()])
      .optional()
      .nullable(),
    repost_count: z
      .union([z.lazy(() => BigIntNullableFilterObjectSchema), z.bigint()])
      .optional()
      .nullable(),
    track_save_count: z
      .union([z.lazy(() => BigIntNullableFilterObjectSchema), z.bigint()])
      .optional()
      .nullable(),
    supporter_count: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    supporting_count: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
  })
  .strict();

export const aggregate_userWhereInputObjectSchema = Schema;
