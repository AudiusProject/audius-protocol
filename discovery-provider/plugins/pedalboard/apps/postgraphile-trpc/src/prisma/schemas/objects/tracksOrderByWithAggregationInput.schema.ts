import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { tracksCountOrderByAggregateInputObjectSchema } from './tracksCountOrderByAggregateInput.schema';
import { tracksAvgOrderByAggregateInputObjectSchema } from './tracksAvgOrderByAggregateInput.schema';
import { tracksMaxOrderByAggregateInputObjectSchema } from './tracksMaxOrderByAggregateInput.schema';
import { tracksMinOrderByAggregateInputObjectSchema } from './tracksMinOrderByAggregateInput.schema';
import { tracksSumOrderByAggregateInputObjectSchema } from './tracksSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.tracksOrderByWithAggregationInput> = z
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
    track_segments: z.lazy(() => SortOrderSchema).optional(),
    created_at: z.lazy(() => SortOrderSchema).optional(),
    description: z.lazy(() => SortOrderSchema).optional(),
    isrc: z.lazy(() => SortOrderSchema).optional(),
    iswc: z.lazy(() => SortOrderSchema).optional(),
    license: z.lazy(() => SortOrderSchema).optional(),
    updated_at: z.lazy(() => SortOrderSchema).optional(),
    cover_art_sizes: z.lazy(() => SortOrderSchema).optional(),
    download: z.lazy(() => SortOrderSchema).optional(),
    is_unlisted: z.lazy(() => SortOrderSchema).optional(),
    field_visibility: z.lazy(() => SortOrderSchema).optional(),
    route_id: z.lazy(() => SortOrderSchema).optional(),
    stem_of: z.lazy(() => SortOrderSchema).optional(),
    remix_of: z.lazy(() => SortOrderSchema).optional(),
    txhash: z.lazy(() => SortOrderSchema).optional(),
    slot: z.lazy(() => SortOrderSchema).optional(),
    is_available: z.lazy(() => SortOrderSchema).optional(),
    is_premium: z.lazy(() => SortOrderSchema).optional(),
    premium_conditions: z.lazy(() => SortOrderSchema).optional(),
    track_cid: z.lazy(() => SortOrderSchema).optional(),
    is_playlist_upload: z.lazy(() => SortOrderSchema).optional(),
    duration: z.lazy(() => SortOrderSchema).optional(),
    ai_attribution_user_id: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => tracksCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z.lazy(() => tracksAvgOrderByAggregateInputObjectSchema).optional(),
    _max: z.lazy(() => tracksMaxOrderByAggregateInputObjectSchema).optional(),
    _min: z.lazy(() => tracksMinOrderByAggregateInputObjectSchema).optional(),
    _sum: z.lazy(() => tracksSumOrderByAggregateInputObjectSchema).optional(),
  })
  .strict();

export const tracksOrderByWithAggregationInputObjectSchema = Schema;
