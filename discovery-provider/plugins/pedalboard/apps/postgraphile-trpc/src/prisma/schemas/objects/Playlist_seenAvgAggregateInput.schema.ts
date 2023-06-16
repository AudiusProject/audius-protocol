import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Playlist_seenAvgAggregateInputType> = z
  .object({
    user_id: z.literal(true).optional(),
    playlist_id: z.literal(true).optional(),
    blocknumber: z.literal(true).optional(),
  })
  .strict();

export const Playlist_seenAvgAggregateInputObjectSchema = Schema;
