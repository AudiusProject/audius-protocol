import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { reward_manager_txsCountOrderByAggregateInputObjectSchema } from './reward_manager_txsCountOrderByAggregateInput.schema';
import { reward_manager_txsAvgOrderByAggregateInputObjectSchema } from './reward_manager_txsAvgOrderByAggregateInput.schema';
import { reward_manager_txsMaxOrderByAggregateInputObjectSchema } from './reward_manager_txsMaxOrderByAggregateInput.schema';
import { reward_manager_txsMinOrderByAggregateInputObjectSchema } from './reward_manager_txsMinOrderByAggregateInput.schema';
import { reward_manager_txsSumOrderByAggregateInputObjectSchema } from './reward_manager_txsSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.reward_manager_txsOrderByWithAggregationInput> =
  z
    .object({
      signature: z.lazy(() => SortOrderSchema).optional(),
      slot: z.lazy(() => SortOrderSchema).optional(),
      created_at: z.lazy(() => SortOrderSchema).optional(),
      _count: z
        .lazy(() => reward_manager_txsCountOrderByAggregateInputObjectSchema)
        .optional(),
      _avg: z
        .lazy(() => reward_manager_txsAvgOrderByAggregateInputObjectSchema)
        .optional(),
      _max: z
        .lazy(() => reward_manager_txsMaxOrderByAggregateInputObjectSchema)
        .optional(),
      _min: z
        .lazy(() => reward_manager_txsMinOrderByAggregateInputObjectSchema)
        .optional(),
      _sum: z
        .lazy(() => reward_manager_txsSumOrderByAggregateInputObjectSchema)
        .optional(),
    })
    .strict();

export const reward_manager_txsOrderByWithAggregationInputObjectSchema = Schema;
