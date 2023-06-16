import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { track_routesCountOrderByAggregateInputObjectSchema } from './track_routesCountOrderByAggregateInput.schema';
import { track_routesAvgOrderByAggregateInputObjectSchema } from './track_routesAvgOrderByAggregateInput.schema';
import { track_routesMaxOrderByAggregateInputObjectSchema } from './track_routesMaxOrderByAggregateInput.schema';
import { track_routesMinOrderByAggregateInputObjectSchema } from './track_routesMinOrderByAggregateInput.schema';
import { track_routesSumOrderByAggregateInputObjectSchema } from './track_routesSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.track_routesOrderByWithAggregationInput> = z
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
    _count: z
      .lazy(() => track_routesCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z
      .lazy(() => track_routesAvgOrderByAggregateInputObjectSchema)
      .optional(),
    _max: z
      .lazy(() => track_routesMaxOrderByAggregateInputObjectSchema)
      .optional(),
    _min: z
      .lazy(() => track_routesMinOrderByAggregateInputObjectSchema)
      .optional(),
    _sum: z
      .lazy(() => track_routesSumOrderByAggregateInputObjectSchema)
      .optional(),
  })
  .strict();

export const track_routesOrderByWithAggregationInputObjectSchema = Schema;
