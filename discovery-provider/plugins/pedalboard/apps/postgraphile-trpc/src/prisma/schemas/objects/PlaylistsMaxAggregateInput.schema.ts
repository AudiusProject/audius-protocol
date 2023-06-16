import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.PlaylistsMaxAggregateInputType> = z
  .object({
    blockhash: z.literal(true).optional(),
    blocknumber: z.literal(true).optional(),
    playlist_id: z.literal(true).optional(),
    playlist_owner_id: z.literal(true).optional(),
    is_album: z.literal(true).optional(),
    is_private: z.literal(true).optional(),
    playlist_name: z.literal(true).optional(),
    playlist_image_multihash: z.literal(true).optional(),
    is_current: z.literal(true).optional(),
    is_delete: z.literal(true).optional(),
    description: z.literal(true).optional(),
    created_at: z.literal(true).optional(),
    upc: z.literal(true).optional(),
    updated_at: z.literal(true).optional(),
    playlist_image_sizes_multihash: z.literal(true).optional(),
    txhash: z.literal(true).optional(),
    last_added_to: z.literal(true).optional(),
    slot: z.literal(true).optional(),
    metadata_multihash: z.literal(true).optional(),
  })
  .strict();

export const PlaylistsMaxAggregateInputObjectSchema = Schema;
