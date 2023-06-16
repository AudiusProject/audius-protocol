import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { rpc_cursorCountOrderByAggregateInputObjectSchema } from './rpc_cursorCountOrderByAggregateInput.schema';
import { rpc_cursorMaxOrderByAggregateInputObjectSchema } from './rpc_cursorMaxOrderByAggregateInput.schema';
import { rpc_cursorMinOrderByAggregateInputObjectSchema } from './rpc_cursorMinOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.rpc_cursorOrderByWithAggregationInput> = z
  .object({
    relayed_by: z.lazy(() => SortOrderSchema).optional(),
    relayed_at: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => rpc_cursorCountOrderByAggregateInputObjectSchema)
      .optional(),
    _max: z
      .lazy(() => rpc_cursorMaxOrderByAggregateInputObjectSchema)
      .optional(),
    _min: z
      .lazy(() => rpc_cursorMinOrderByAggregateInputObjectSchema)
      .optional(),
  })
  .strict();

export const rpc_cursorOrderByWithAggregationInputObjectSchema = Schema;
