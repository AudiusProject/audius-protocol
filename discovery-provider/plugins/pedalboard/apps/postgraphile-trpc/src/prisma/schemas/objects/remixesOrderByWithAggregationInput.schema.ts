import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { remixesCountOrderByAggregateInputObjectSchema } from './remixesCountOrderByAggregateInput.schema';
import { remixesAvgOrderByAggregateInputObjectSchema } from './remixesAvgOrderByAggregateInput.schema';
import { remixesMaxOrderByAggregateInputObjectSchema } from './remixesMaxOrderByAggregateInput.schema';
import { remixesMinOrderByAggregateInputObjectSchema } from './remixesMinOrderByAggregateInput.schema';
import { remixesSumOrderByAggregateInputObjectSchema } from './remixesSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.remixesOrderByWithAggregationInput> = z
  .object({
    parent_track_id: z.lazy(() => SortOrderSchema).optional(),
    child_track_id: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => remixesCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z.lazy(() => remixesAvgOrderByAggregateInputObjectSchema).optional(),
    _max: z.lazy(() => remixesMaxOrderByAggregateInputObjectSchema).optional(),
    _min: z.lazy(() => remixesMinOrderByAggregateInputObjectSchema).optional(),
    _sum: z.lazy(() => remixesSumOrderByAggregateInputObjectSchema).optional(),
  })
  .strict();

export const remixesOrderByWithAggregationInputObjectSchema = Schema;
