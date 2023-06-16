import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.TracksMinAggregateInputType> = z
  .object({
    blockhash: z.literal(true).optional(),
    track_id: z.literal(true).optional(),
    is_current: z.literal(true).optional(),
    is_delete: z.literal(true).optional(),
    owner_id: z.literal(true).optional(),
    title: z.literal(true).optional(),
    length: z.literal(true).optional(),
    cover_art: z.literal(true).optional(),
    tags: z.literal(true).optional(),
    genre: z.literal(true).optional(),
    mood: z.literal(true).optional(),
    credits_splits: z.literal(true).optional(),
    create_date: z.literal(true).optional(),
    release_date: z.literal(true).optional(),
    file_type: z.literal(true).optional(),
    metadata_multihash: z.literal(true).optional(),
    blocknumber: z.literal(true).optional(),
    created_at: z.literal(true).optional(),
    description: z.literal(true).optional(),
    isrc: z.literal(true).optional(),
    iswc: z.literal(true).optional(),
    license: z.literal(true).optional(),
    updated_at: z.literal(true).optional(),
    cover_art_sizes: z.literal(true).optional(),
    is_unlisted: z.literal(true).optional(),
    route_id: z.literal(true).optional(),
    txhash: z.literal(true).optional(),
    slot: z.literal(true).optional(),
    is_available: z.literal(true).optional(),
    is_premium: z.literal(true).optional(),
    track_cid: z.literal(true).optional(),
    is_playlist_upload: z.literal(true).optional(),
    duration: z.literal(true).optional(),
    ai_attribution_user_id: z.literal(true).optional(),
  })
  .strict();

export const TracksMinAggregateInputObjectSchema = Schema;
