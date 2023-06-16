import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.playlistsCountOrderByAggregateInput> = z
  .object({
    blockhash: z.lazy(() => SortOrderSchema).optional(),
    blocknumber: z.lazy(() => SortOrderSchema).optional(),
    playlist_id: z.lazy(() => SortOrderSchema).optional(),
    playlist_owner_id: z.lazy(() => SortOrderSchema).optional(),
    is_album: z.lazy(() => SortOrderSchema).optional(),
    is_private: z.lazy(() => SortOrderSchema).optional(),
    playlist_name: z.lazy(() => SortOrderSchema).optional(),
    playlist_contents: z.lazy(() => SortOrderSchema).optional(),
    playlist_image_multihash: z.lazy(() => SortOrderSchema).optional(),
    is_current: z.lazy(() => SortOrderSchema).optional(),
    is_delete: z.lazy(() => SortOrderSchema).optional(),
    description: z.lazy(() => SortOrderSchema).optional(),
    created_at: z.lazy(() => SortOrderSchema).optional(),
    upc: z.lazy(() => SortOrderSchema).optional(),
    updated_at: z.lazy(() => SortOrderSchema).optional(),
    playlist_image_sizes_multihash: z.lazy(() => SortOrderSchema).optional(),
    txhash: z.lazy(() => SortOrderSchema).optional(),
    last_added_to: z.lazy(() => SortOrderSchema).optional(),
    slot: z.lazy(() => SortOrderSchema).optional(),
    metadata_multihash: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const playlistsCountOrderByAggregateInputObjectSchema = Schema;
