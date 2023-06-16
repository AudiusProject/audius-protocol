import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { user_tipsCountOrderByAggregateInputObjectSchema } from './user_tipsCountOrderByAggregateInput.schema';
import { user_tipsAvgOrderByAggregateInputObjectSchema } from './user_tipsAvgOrderByAggregateInput.schema';
import { user_tipsMaxOrderByAggregateInputObjectSchema } from './user_tipsMaxOrderByAggregateInput.schema';
import { user_tipsMinOrderByAggregateInputObjectSchema } from './user_tipsMinOrderByAggregateInput.schema';
import { user_tipsSumOrderByAggregateInputObjectSchema } from './user_tipsSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_tipsOrderByWithAggregationInput> = z
  .object({
    slot: z.lazy(() => SortOrderSchema).optional(),
    signature: z.lazy(() => SortOrderSchema).optional(),
    sender_user_id: z.lazy(() => SortOrderSchema).optional(),
    receiver_user_id: z.lazy(() => SortOrderSchema).optional(),
    amount: z.lazy(() => SortOrderSchema).optional(),
    created_at: z.lazy(() => SortOrderSchema).optional(),
    updated_at: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => user_tipsCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z
      .lazy(() => user_tipsAvgOrderByAggregateInputObjectSchema)
      .optional(),
    _max: z
      .lazy(() => user_tipsMaxOrderByAggregateInputObjectSchema)
      .optional(),
    _min: z
      .lazy(() => user_tipsMinOrderByAggregateInputObjectSchema)
      .optional(),
    _sum: z
      .lazy(() => user_tipsSumOrderByAggregateInputObjectSchema)
      .optional(),
  })
  .strict();

export const user_tipsOrderByWithAggregationInputObjectSchema = Schema;
