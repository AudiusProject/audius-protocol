import { z } from 'zod';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.UsersMinAggregateInputType> = z
  .object({
    blockhash: z.literal(true).optional(),
    user_id: z.literal(true).optional(),
    is_current: z.literal(true).optional(),
    handle: z.literal(true).optional(),
    wallet: z.literal(true).optional(),
    name: z.literal(true).optional(),
    profile_picture: z.literal(true).optional(),
    cover_photo: z.literal(true).optional(),
    bio: z.literal(true).optional(),
    location: z.literal(true).optional(),
    metadata_multihash: z.literal(true).optional(),
    creator_node_endpoint: z.literal(true).optional(),
    blocknumber: z.literal(true).optional(),
    is_verified: z.literal(true).optional(),
    created_at: z.literal(true).optional(),
    updated_at: z.literal(true).optional(),
    handle_lc: z.literal(true).optional(),
    cover_photo_sizes: z.literal(true).optional(),
    profile_picture_sizes: z.literal(true).optional(),
    primary_id: z.literal(true).optional(),
    replica_set_update_signer: z.literal(true).optional(),
    has_collectibles: z.literal(true).optional(),
    txhash: z.literal(true).optional(),
    is_deactivated: z.literal(true).optional(),
    slot: z.literal(true).optional(),
    user_storage_account: z.literal(true).optional(),
    user_authority_account: z.literal(true).optional(),
    artist_pick_track_id: z.literal(true).optional(),
    is_available: z.literal(true).optional(),
    is_storage_v2: z.literal(true).optional(),
    allow_ai_attribution: z.literal(true).optional(),
  })
  .strict();

export const UsersMinAggregateInputObjectSchema = Schema;
