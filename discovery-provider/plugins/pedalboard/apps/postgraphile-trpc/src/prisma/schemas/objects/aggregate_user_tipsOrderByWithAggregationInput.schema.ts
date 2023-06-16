import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { aggregate_user_tipsCountOrderByAggregateInputObjectSchema } from './aggregate_user_tipsCountOrderByAggregateInput.schema';
import { aggregate_user_tipsAvgOrderByAggregateInputObjectSchema } from './aggregate_user_tipsAvgOrderByAggregateInput.schema';
import { aggregate_user_tipsMaxOrderByAggregateInputObjectSchema } from './aggregate_user_tipsMaxOrderByAggregateInput.schema';
import { aggregate_user_tipsMinOrderByAggregateInputObjectSchema } from './aggregate_user_tipsMinOrderByAggregateInput.schema';
import { aggregate_user_tipsSumOrderByAggregateInputObjectSchema } from './aggregate_user_tipsSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_user_tipsOrderByWithAggregationInput> =
  z
    .object({
      sender_user_id: z.lazy(() => SortOrderSchema).optional(),
      receiver_user_id: z.lazy(() => SortOrderSchema).optional(),
      amount: z.lazy(() => SortOrderSchema).optional(),
      _count: z
        .lazy(() => aggregate_user_tipsCountOrderByAggregateInputObjectSchema)
        .optional(),
      _avg: z
        .lazy(() => aggregate_user_tipsAvgOrderByAggregateInputObjectSchema)
        .optional(),
      _max: z
        .lazy(() => aggregate_user_tipsMaxOrderByAggregateInputObjectSchema)
        .optional(),
      _min: z
        .lazy(() => aggregate_user_tipsMinOrderByAggregateInputObjectSchema)
        .optional(),
      _sum: z
        .lazy(() => aggregate_user_tipsSumOrderByAggregateInputObjectSchema)
        .optional(),
    })
    .strict();

export const aggregate_user_tipsOrderByWithAggregationInputObjectSchema =
  Schema;
