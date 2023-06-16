import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { spl_token_txCountOrderByAggregateInputObjectSchema } from './spl_token_txCountOrderByAggregateInput.schema';
import { spl_token_txAvgOrderByAggregateInputObjectSchema } from './spl_token_txAvgOrderByAggregateInput.schema';
import { spl_token_txMaxOrderByAggregateInputObjectSchema } from './spl_token_txMaxOrderByAggregateInput.schema';
import { spl_token_txMinOrderByAggregateInputObjectSchema } from './spl_token_txMinOrderByAggregateInput.schema';
import { spl_token_txSumOrderByAggregateInputObjectSchema } from './spl_token_txSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.spl_token_txOrderByWithAggregationInput> = z
  .object({
    last_scanned_slot: z.lazy(() => SortOrderSchema).optional(),
    signature: z.lazy(() => SortOrderSchema).optional(),
    created_at: z.lazy(() => SortOrderSchema).optional(),
    updated_at: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => spl_token_txCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z
      .lazy(() => spl_token_txAvgOrderByAggregateInputObjectSchema)
      .optional(),
    _max: z
      .lazy(() => spl_token_txMaxOrderByAggregateInputObjectSchema)
      .optional(),
    _min: z
      .lazy(() => spl_token_txMinOrderByAggregateInputObjectSchema)
      .optional(),
    _sum: z
      .lazy(() => spl_token_txSumOrderByAggregateInputObjectSchema)
      .optional(),
  })
  .strict();

export const spl_token_txOrderByWithAggregationInputObjectSchema = Schema;
