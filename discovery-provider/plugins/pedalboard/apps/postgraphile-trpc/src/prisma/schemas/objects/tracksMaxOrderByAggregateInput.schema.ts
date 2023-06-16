import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.tracksMaxOrderByAggregateInput> = z
  .object({
    blockhash: z.lazy(() => SortOrderSchema).optional(),
    track_id: z.lazy(() => SortOrderSchema).optional(),
    is_current: z.lazy(() => SortOrderSchema).optional(),
    is_delete: z.lazy(() => SortOrderSchema).optional(),
    owner_id: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    length: z.lazy(() => SortOrderSchema).optional(),
    cover_art: z.lazy(() => SortOrderSchema).optional(),
    tags: z.lazy(() => SortOrderSchema).optional(),
    genre: z.lazy(() => SortOrderSchema).optional(),
    mood: z.lazy(() => SortOrderSchema).optional(),
    credits_splits: z.lazy(() => SortOrderSchema).optional(),
    create_date: z.lazy(() => SortOrderSchema).optional(),
    release_date: z.lazy(() => SortOrderSchema).optional(),
    file_type: z.lazy(() => SortOrderSchema).optional(),
    metadata_multihash: z.lazy(() => SortOrderSchema).optional(),
    blocknumber: z.lazy(() => SortOrderSchema).optional(),
    created_at: z.lazy(() => SortOrderSchema).optional(),
    description: z.lazy(() => SortOrderSchema).optional(),
    isrc: z.lazy(() => SortOrderSchema).optional(),
    iswc: z.lazy(() => SortOrderSchema).optional(),
    license: z.lazy(() => SortOrderSchema).optional(),
    updated_at: z.lazy(() => SortOrderSchema).optional(),
    cover_art_sizes: z.lazy(() => SortOrderSchema).optional(),
    is_unlisted: z.lazy(() => SortOrderSchema).optional(),
    route_id: z.lazy(() => SortOrderSchema).optional(),
    txhash: z.lazy(() => SortOrderSchema).optional(),
    slot: z.lazy(() => SortOrderSchema).optional(),
    is_available: z.lazy(() => SortOrderSchema).optional(),
    is_premium: z.lazy(() => SortOrderSchema).optional(),
    track_cid: z.lazy(() => SortOrderSchema).optional(),
    is_playlist_upload: z.lazy(() => SortOrderSchema).optional(),
    duration: z.lazy(() => SortOrderSchema).optional(),
    ai_attribution_user_id: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const tracksMaxOrderByAggregateInputObjectSchema = Schema;
