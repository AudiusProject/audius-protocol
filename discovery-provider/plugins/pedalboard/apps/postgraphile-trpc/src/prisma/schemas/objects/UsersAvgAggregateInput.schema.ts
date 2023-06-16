import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.UsersAvgAggregateInputType> = z
  .object({
    user_id: z.literal(true).optional(),
    blocknumber: z.literal(true).optional(),
    primary_id: z.literal(true).optional(),
    secondary_ids: z.literal(true).optional(),
    slot: z.literal(true).optional(),
    artist_pick_track_id: z.literal(true).optional(),
  })
  .strict();

export const UsersAvgAggregateInputObjectSchema = Schema;
