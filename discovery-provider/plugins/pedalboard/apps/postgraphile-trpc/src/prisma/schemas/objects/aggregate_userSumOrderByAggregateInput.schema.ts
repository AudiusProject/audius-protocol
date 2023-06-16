import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_userSumOrderByAggregateInput> = z
  .object({
    user_id: z.lazy(() => SortOrderSchema).optional(),
    track_count: z.lazy(() => SortOrderSchema).optional(),
    playlist_count: z.lazy(() => SortOrderSchema).optional(),
    album_count: z.lazy(() => SortOrderSchema).optional(),
    follower_count: z.lazy(() => SortOrderSchema).optional(),
    following_count: z.lazy(() => SortOrderSchema).optional(),
    repost_count: z.lazy(() => SortOrderSchema).optional(),
    track_save_count: z.lazy(() => SortOrderSchema).optional(),
    supporter_count: z.lazy(() => SortOrderSchema).optional(),
    supporting_count: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const aggregate_userSumOrderByAggregateInputObjectSchema = Schema;
