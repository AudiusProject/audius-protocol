import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_userCreateManyInput> = z
  .object({
    user_id: z.number(),
    track_count: z.bigint().optional().nullable(),
    playlist_count: z.bigint().optional().nullable(),
    album_count: z.bigint().optional().nullable(),
    follower_count: z.bigint().optional().nullable(),
    following_count: z.bigint().optional().nullable(),
    repost_count: z.bigint().optional().nullable(),
    track_save_count: z.bigint().optional().nullable(),
    supporter_count: z.number().optional(),
    supporting_count: z.number().optional(),
  })
  .strict();

export const aggregate_userCreateManyInputObjectSchema = Schema;
