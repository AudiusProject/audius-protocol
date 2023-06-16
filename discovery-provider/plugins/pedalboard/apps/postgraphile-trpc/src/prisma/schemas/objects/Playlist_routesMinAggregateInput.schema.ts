import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Playlist_routesMinAggregateInputType> = z
  .object({
    slug: z.literal(true).optional(),
    title_slug: z.literal(true).optional(),
    collision_id: z.literal(true).optional(),
    owner_id: z.literal(true).optional(),
    playlist_id: z.literal(true).optional(),
    is_current: z.literal(true).optional(),
    blockhash: z.literal(true).optional(),
    blocknumber: z.literal(true).optional(),
    txhash: z.literal(true).optional(),
  })
  .strict();

export const Playlist_routesMinAggregateInputObjectSchema = Schema;
