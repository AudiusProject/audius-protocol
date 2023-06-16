import { z } from 'zod';
import { IntFilterObjectSchema } from './IntFilter.schema';
import { BoolNullableFilterObjectSchema } from './BoolNullableFilter.schema';
import { IntNullableFilterObjectSchema } from './IntNullableFilter.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_playlistWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => aggregate_playlistWhereInputObjectSchema),
        z.lazy(() => aggregate_playlistWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => aggregate_playlistWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => aggregate_playlistWhereInputObjectSchema),
        z.lazy(() => aggregate_playlistWhereInputObjectSchema).array(),
      ])
      .optional(),
    playlist_id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    is_album: z
      .union([z.lazy(() => BoolNullableFilterObjectSchema), z.boolean()])
      .optional()
      .nullable(),
    repost_count: z
      .union([z.lazy(() => IntNullableFilterObjectSchema), z.number()])
      .optional()
      .nullable(),
    save_count: z
      .union([z.lazy(() => IntNullableFilterObjectSchema), z.number()])
      .optional()
      .nullable(),
  })
  .strict();

export const aggregate_playlistWhereInputObjectSchema = Schema;
