import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.PlaylistsSumAggregateInputType> = z
  .object({
    blocknumber: z.literal(true).optional(),
    playlist_id: z.literal(true).optional(),
    playlist_owner_id: z.literal(true).optional(),
    slot: z.literal(true).optional(),
  })
  .strict();

export const PlaylistsSumAggregateInputObjectSchema = Schema;
