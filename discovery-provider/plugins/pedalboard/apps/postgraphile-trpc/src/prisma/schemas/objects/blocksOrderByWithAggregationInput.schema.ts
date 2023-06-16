import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { blocksCountOrderByAggregateInputObjectSchema } from './blocksCountOrderByAggregateInput.schema';
import { blocksAvgOrderByAggregateInputObjectSchema } from './blocksAvgOrderByAggregateInput.schema';
import { blocksMaxOrderByAggregateInputObjectSchema } from './blocksMaxOrderByAggregateInput.schema';
import { blocksMinOrderByAggregateInputObjectSchema } from './blocksMinOrderByAggregateInput.schema';
import { blocksSumOrderByAggregateInputObjectSchema } from './blocksSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.blocksOrderByWithAggregationInput> = z
  .object({
    blockhash: z.lazy(() => SortOrderSchema).optional(),
    parenthash: z.lazy(() => SortOrderSchema).optional(),
    is_current: z.lazy(() => SortOrderSchema).optional(),
    number: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => blocksCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z.lazy(() => blocksAvgOrderByAggregateInputObjectSchema).optional(),
    _max: z.lazy(() => blocksMaxOrderByAggregateInputObjectSchema).optional(),
    _min: z.lazy(() => blocksMinOrderByAggregateInputObjectSchema).optional(),
    _sum: z.lazy(() => blocksSumOrderByAggregateInputObjectSchema).optional(),
  })
  .strict();

export const blocksOrderByWithAggregationInputObjectSchema = Schema;
