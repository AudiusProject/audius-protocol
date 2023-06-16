import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { indexing_checkpointsCountOrderByAggregateInputObjectSchema } from './indexing_checkpointsCountOrderByAggregateInput.schema';
import { indexing_checkpointsAvgOrderByAggregateInputObjectSchema } from './indexing_checkpointsAvgOrderByAggregateInput.schema';
import { indexing_checkpointsMaxOrderByAggregateInputObjectSchema } from './indexing_checkpointsMaxOrderByAggregateInput.schema';
import { indexing_checkpointsMinOrderByAggregateInputObjectSchema } from './indexing_checkpointsMinOrderByAggregateInput.schema';
import { indexing_checkpointsSumOrderByAggregateInputObjectSchema } from './indexing_checkpointsSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.indexing_checkpointsOrderByWithAggregationInput> =
  z
    .object({
      tablename: z.lazy(() => SortOrderSchema).optional(),
      last_checkpoint: z.lazy(() => SortOrderSchema).optional(),
      signature: z.lazy(() => SortOrderSchema).optional(),
      _count: z
        .lazy(() => indexing_checkpointsCountOrderByAggregateInputObjectSchema)
        .optional(),
      _avg: z
        .lazy(() => indexing_checkpointsAvgOrderByAggregateInputObjectSchema)
        .optional(),
      _max: z
        .lazy(() => indexing_checkpointsMaxOrderByAggregateInputObjectSchema)
        .optional(),
      _min: z
        .lazy(() => indexing_checkpointsMinOrderByAggregateInputObjectSchema)
        .optional(),
      _sum: z
        .lazy(() => indexing_checkpointsSumOrderByAggregateInputObjectSchema)
        .optional(),
    })
    .strict();

export const indexing_checkpointsOrderByWithAggregationInputObjectSchema =
  Schema;
