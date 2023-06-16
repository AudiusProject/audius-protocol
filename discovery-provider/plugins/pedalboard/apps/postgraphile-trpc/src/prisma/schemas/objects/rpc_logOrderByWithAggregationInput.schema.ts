import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { rpc_logCountOrderByAggregateInputObjectSchema } from './rpc_logCountOrderByAggregateInput.schema';
import { rpc_logMaxOrderByAggregateInputObjectSchema } from './rpc_logMaxOrderByAggregateInput.schema';
import { rpc_logMinOrderByAggregateInputObjectSchema } from './rpc_logMinOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.rpc_logOrderByWithAggregationInput> = z
  .object({
    relayed_at: z.lazy(() => SortOrderSchema).optional(),
    from_wallet: z.lazy(() => SortOrderSchema).optional(),
    rpc: z.lazy(() => SortOrderSchema).optional(),
    sig: z.lazy(() => SortOrderSchema).optional(),
    relayed_by: z.lazy(() => SortOrderSchema).optional(),
    applied_at: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => rpc_logCountOrderByAggregateInputObjectSchema)
      .optional(),
    _max: z.lazy(() => rpc_logMaxOrderByAggregateInputObjectSchema).optional(),
    _min: z.lazy(() => rpc_logMinOrderByAggregateInputObjectSchema).optional(),
  })
  .strict();

export const rpc_logOrderByWithAggregationInputObjectSchema = Schema;
