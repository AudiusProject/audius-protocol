import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.usersSumOrderByAggregateInput> = z
  .object({
    user_id: z.lazy(() => SortOrderSchema).optional(),
    blocknumber: z.lazy(() => SortOrderSchema).optional(),
    primary_id: z.lazy(() => SortOrderSchema).optional(),
    secondary_ids: z.lazy(() => SortOrderSchema).optional(),
    slot: z.lazy(() => SortOrderSchema).optional(),
    artist_pick_track_id: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const usersSumOrderByAggregateInputObjectSchema = Schema;
