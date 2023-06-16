import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.track_routesMinOrderByAggregateInput> = z
  .object({
    slug: z.lazy(() => SortOrderSchema).optional(),
    title_slug: z.lazy(() => SortOrderSchema).optional(),
    collision_id: z.lazy(() => SortOrderSchema).optional(),
    owner_id: z.lazy(() => SortOrderSchema).optional(),
    track_id: z.lazy(() => SortOrderSchema).optional(),
    is_current: z.lazy(() => SortOrderSchema).optional(),
    blockhash: z.lazy(() => SortOrderSchema).optional(),
    blocknumber: z.lazy(() => SortOrderSchema).optional(),
    txhash: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const track_routesMinOrderByAggregateInputObjectSchema = Schema;
