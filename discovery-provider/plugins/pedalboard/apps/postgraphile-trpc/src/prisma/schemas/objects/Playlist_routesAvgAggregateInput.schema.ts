import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.Playlist_routesAvgAggregateInputType> = z
  .object({
    collision_id: z.literal(true).optional(),
    owner_id: z.literal(true).optional(),
    playlist_id: z.literal(true).optional(),
    blocknumber: z.literal(true).optional(),
  })
  .strict();

export const Playlist_routesAvgAggregateInputObjectSchema = Schema;
