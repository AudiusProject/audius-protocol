import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { rpclogCountOrderByAggregateInputObjectSchema } from './rpclogCountOrderByAggregateInput.schema';
import { rpclogAvgOrderByAggregateInputObjectSchema } from './rpclogAvgOrderByAggregateInput.schema';
import { rpclogMaxOrderByAggregateInputObjectSchema } from './rpclogMaxOrderByAggregateInput.schema';
import { rpclogMinOrderByAggregateInputObjectSchema } from './rpclogMinOrderByAggregateInput.schema';
import { rpclogSumOrderByAggregateInputObjectSchema } from './rpclogSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.rpclogOrderByWithAggregationInput> = z
  .object({
    cuid: z.lazy(() => SortOrderSchema).optional(),
    wallet: z.lazy(() => SortOrderSchema).optional(),
    method: z.lazy(() => SortOrderSchema).optional(),
    params: z.lazy(() => SortOrderSchema).optional(),
    jetstream_seq: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => rpclogCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z.lazy(() => rpclogAvgOrderByAggregateInputObjectSchema).optional(),
    _max: z.lazy(() => rpclogMaxOrderByAggregateInputObjectSchema).optional(),
    _min: z.lazy(() => rpclogMinOrderByAggregateInputObjectSchema).optional(),
    _sum: z.lazy(() => rpclogSumOrderByAggregateInputObjectSchema).optional(),
  })
  .strict();

export const rpclogOrderByWithAggregationInputObjectSchema = Schema;
