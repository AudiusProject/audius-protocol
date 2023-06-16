import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { eth_blocksCountOrderByAggregateInputObjectSchema } from './eth_blocksCountOrderByAggregateInput.schema';
import { eth_blocksAvgOrderByAggregateInputObjectSchema } from './eth_blocksAvgOrderByAggregateInput.schema';
import { eth_blocksMaxOrderByAggregateInputObjectSchema } from './eth_blocksMaxOrderByAggregateInput.schema';
import { eth_blocksMinOrderByAggregateInputObjectSchema } from './eth_blocksMinOrderByAggregateInput.schema';
import { eth_blocksSumOrderByAggregateInputObjectSchema } from './eth_blocksSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.eth_blocksOrderByWithAggregationInput> = z
  .object({
    last_scanned_block: z.lazy(() => SortOrderSchema).optional(),
    created_at: z.lazy(() => SortOrderSchema).optional(),
    updated_at: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => eth_blocksCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z
      .lazy(() => eth_blocksAvgOrderByAggregateInputObjectSchema)
      .optional(),
    _max: z
      .lazy(() => eth_blocksMaxOrderByAggregateInputObjectSchema)
      .optional(),
    _min: z
      .lazy(() => eth_blocksMinOrderByAggregateInputObjectSchema)
      .optional(),
    _sum: z
      .lazy(() => eth_blocksSumOrderByAggregateInputObjectSchema)
      .optional(),
  })
  .strict();

export const eth_blocksOrderByWithAggregationInputObjectSchema = Schema;
