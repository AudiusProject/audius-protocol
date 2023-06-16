import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { audius_data_txsCountOrderByAggregateInputObjectSchema } from './audius_data_txsCountOrderByAggregateInput.schema';
import { audius_data_txsAvgOrderByAggregateInputObjectSchema } from './audius_data_txsAvgOrderByAggregateInput.schema';
import { audius_data_txsMaxOrderByAggregateInputObjectSchema } from './audius_data_txsMaxOrderByAggregateInput.schema';
import { audius_data_txsMinOrderByAggregateInputObjectSchema } from './audius_data_txsMinOrderByAggregateInput.schema';
import { audius_data_txsSumOrderByAggregateInputObjectSchema } from './audius_data_txsSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.audius_data_txsOrderByWithAggregationInput> = z
  .object({
    signature: z.lazy(() => SortOrderSchema).optional(),
    slot: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => audius_data_txsCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z
      .lazy(() => audius_data_txsAvgOrderByAggregateInputObjectSchema)
      .optional(),
    _max: z
      .lazy(() => audius_data_txsMaxOrderByAggregateInputObjectSchema)
      .optional(),
    _min: z
      .lazy(() => audius_data_txsMinOrderByAggregateInputObjectSchema)
      .optional(),
    _sum: z
      .lazy(() => audius_data_txsSumOrderByAggregateInputObjectSchema)
      .optional(),
  })
  .strict();

export const audius_data_txsOrderByWithAggregationInputObjectSchema = Schema;
