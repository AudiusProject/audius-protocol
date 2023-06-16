import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.playlist_routesSumOrderByAggregateInput> = z
  .object({
    collision_id: z.lazy(() => SortOrderSchema).optional(),
    owner_id: z.lazy(() => SortOrderSchema).optional(),
    playlist_id: z.lazy(() => SortOrderSchema).optional(),
    blocknumber: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const playlist_routesSumOrderByAggregateInputObjectSchema = Schema;
