import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { playlist_routesCountOrderByAggregateInputObjectSchema } from './playlist_routesCountOrderByAggregateInput.schema';
import { playlist_routesAvgOrderByAggregateInputObjectSchema } from './playlist_routesAvgOrderByAggregateInput.schema';
import { playlist_routesMaxOrderByAggregateInputObjectSchema } from './playlist_routesMaxOrderByAggregateInput.schema';
import { playlist_routesMinOrderByAggregateInputObjectSchema } from './playlist_routesMinOrderByAggregateInput.schema';
import { playlist_routesSumOrderByAggregateInputObjectSchema } from './playlist_routesSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.playlist_routesOrderByWithAggregationInput> = z
  .object({
    slug: z.lazy(() => SortOrderSchema).optional(),
    title_slug: z.lazy(() => SortOrderSchema).optional(),
    collision_id: z.lazy(() => SortOrderSchema).optional(),
    owner_id: z.lazy(() => SortOrderSchema).optional(),
    playlist_id: z.lazy(() => SortOrderSchema).optional(),
    is_current: z.lazy(() => SortOrderSchema).optional(),
    blockhash: z.lazy(() => SortOrderSchema).optional(),
    blocknumber: z.lazy(() => SortOrderSchema).optional(),
    txhash: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => playlist_routesCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z
      .lazy(() => playlist_routesAvgOrderByAggregateInputObjectSchema)
      .optional(),
    _max: z
      .lazy(() => playlist_routesMaxOrderByAggregateInputObjectSchema)
      .optional(),
    _min: z
      .lazy(() => playlist_routesMinOrderByAggregateInputObjectSchema)
      .optional(),
    _sum: z
      .lazy(() => playlist_routesSumOrderByAggregateInputObjectSchema)
      .optional(),
  })
  .strict();

export const playlist_routesOrderByWithAggregationInputObjectSchema = Schema;
