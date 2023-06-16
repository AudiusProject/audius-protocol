import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.usersCountOrderByAggregateInput> = z
  .object({
    blockhash: z.lazy(() => SortOrderSchema).optional(),
    user_id: z.lazy(() => SortOrderSchema).optional(),
    is_current: z.lazy(() => SortOrderSchema).optional(),
    handle: z.lazy(() => SortOrderSchema).optional(),
    wallet: z.lazy(() => SortOrderSchema).optional(),
    name: z.lazy(() => SortOrderSchema).optional(),
    profile_picture: z.lazy(() => SortOrderSchema).optional(),
    cover_photo: z.lazy(() => SortOrderSchema).optional(),
    bio: z.lazy(() => SortOrderSchema).optional(),
    location: z.lazy(() => SortOrderSchema).optional(),
    metadata_multihash: z.lazy(() => SortOrderSchema).optional(),
    creator_node_endpoint: z.lazy(() => SortOrderSchema).optional(),
    blocknumber: z.lazy(() => SortOrderSchema).optional(),
    is_verified: z.lazy(() => SortOrderSchema).optional(),
    created_at: z.lazy(() => SortOrderSchema).optional(),
    updated_at: z.lazy(() => SortOrderSchema).optional(),
    handle_lc: z.lazy(() => SortOrderSchema).optional(),
    cover_photo_sizes: z.lazy(() => SortOrderSchema).optional(),
    profile_picture_sizes: z.lazy(() => SortOrderSchema).optional(),
    primary_id: z.lazy(() => SortOrderSchema).optional(),
    secondary_ids: z.lazy(() => SortOrderSchema).optional(),
    replica_set_update_signer: z.lazy(() => SortOrderSchema).optional(),
    has_collectibles: z.lazy(() => SortOrderSchema).optional(),
    txhash: z.lazy(() => SortOrderSchema).optional(),
    playlist_library: z.lazy(() => SortOrderSchema).optional(),
    is_deactivated: z.lazy(() => SortOrderSchema).optional(),
    slot: z.lazy(() => SortOrderSchema).optional(),
    user_storage_account: z.lazy(() => SortOrderSchema).optional(),
    user_authority_account: z.lazy(() => SortOrderSchema).optional(),
    artist_pick_track_id: z.lazy(() => SortOrderSchema).optional(),
    is_available: z.lazy(() => SortOrderSchema).optional(),
    is_storage_v2: z.lazy(() => SortOrderSchema).optional(),
    allow_ai_attribution: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const usersCountOrderByAggregateInputObjectSchema = Schema;
