import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Aggregate_userMaxAggregateInputType> = z
  .object({
    user_id: z.literal(true).optional(),
    track_count: z.literal(true).optional(),
    playlist_count: z.literal(true).optional(),
    album_count: z.literal(true).optional(),
    follower_count: z.literal(true).optional(),
    following_count: z.literal(true).optional(),
    repost_count: z.literal(true).optional(),
    track_save_count: z.literal(true).optional(),
    supporter_count: z.literal(true).optional(),
    supporting_count: z.literal(true).optional(),
  })
  .strict();

export const Aggregate_userMaxAggregateInputObjectSchema = Schema;
