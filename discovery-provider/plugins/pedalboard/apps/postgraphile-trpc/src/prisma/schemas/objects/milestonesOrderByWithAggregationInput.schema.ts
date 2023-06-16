import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { milestonesCountOrderByAggregateInputObjectSchema } from './milestonesCountOrderByAggregateInput.schema';
import { milestonesAvgOrderByAggregateInputObjectSchema } from './milestonesAvgOrderByAggregateInput.schema';
import { milestonesMaxOrderByAggregateInputObjectSchema } from './milestonesMaxOrderByAggregateInput.schema';
import { milestonesMinOrderByAggregateInputObjectSchema } from './milestonesMinOrderByAggregateInput.schema';
import { milestonesSumOrderByAggregateInputObjectSchema } from './milestonesSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.milestonesOrderByWithAggregationInput> = z
  .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    name: z.lazy(() => SortOrderSchema).optional(),
    threshold: z.lazy(() => SortOrderSchema).optional(),
    blocknumber: z.lazy(() => SortOrderSchema).optional(),
    slot: z.lazy(() => SortOrderSchema).optional(),
    timestamp: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => milestonesCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z
      .lazy(() => milestonesAvgOrderByAggregateInputObjectSchema)
      .optional(),
    _max: z
      .lazy(() => milestonesMaxOrderByAggregateInputObjectSchema)
      .optional(),
    _min: z
      .lazy(() => milestonesMinOrderByAggregateInputObjectSchema)
      .optional(),
    _sum: z
      .lazy(() => milestonesSumOrderByAggregateInputObjectSchema)
      .optional(),
  })
  .strict();

export const milestonesOrderByWithAggregationInputObjectSchema = Schema;
