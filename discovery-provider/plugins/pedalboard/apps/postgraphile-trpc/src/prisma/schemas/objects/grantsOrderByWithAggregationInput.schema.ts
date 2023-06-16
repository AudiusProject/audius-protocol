import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { grantsCountOrderByAggregateInputObjectSchema } from './grantsCountOrderByAggregateInput.schema';
import { grantsAvgOrderByAggregateInputObjectSchema } from './grantsAvgOrderByAggregateInput.schema';
import { grantsMaxOrderByAggregateInputObjectSchema } from './grantsMaxOrderByAggregateInput.schema';
import { grantsMinOrderByAggregateInputObjectSchema } from './grantsMinOrderByAggregateInput.schema';
import { grantsSumOrderByAggregateInputObjectSchema } from './grantsSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.grantsOrderByWithAggregationInput> = z
  .object({
    blockhash: z.lazy(() => SortOrderSchema).optional(),
    blocknumber: z.lazy(() => SortOrderSchema).optional(),
    grantee_address: z.lazy(() => SortOrderSchema).optional(),
    user_id: z.lazy(() => SortOrderSchema).optional(),
    is_revoked: z.lazy(() => SortOrderSchema).optional(),
    is_current: z.lazy(() => SortOrderSchema).optional(),
    is_approved: z.lazy(() => SortOrderSchema).optional(),
    updated_at: z.lazy(() => SortOrderSchema).optional(),
    created_at: z.lazy(() => SortOrderSchema).optional(),
    txhash: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => grantsCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z.lazy(() => grantsAvgOrderByAggregateInputObjectSchema).optional(),
    _max: z.lazy(() => grantsMaxOrderByAggregateInputObjectSchema).optional(),
    _min: z.lazy(() => grantsMinOrderByAggregateInputObjectSchema).optional(),
    _sum: z.lazy(() => grantsSumOrderByAggregateInputObjectSchema).optional(),
  })
  .strict();

export const grantsOrderByWithAggregationInputObjectSchema = Schema;
