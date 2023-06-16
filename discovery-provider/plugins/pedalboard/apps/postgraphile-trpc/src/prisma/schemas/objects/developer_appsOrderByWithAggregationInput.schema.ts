import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { developer_appsCountOrderByAggregateInputObjectSchema } from './developer_appsCountOrderByAggregateInput.schema';
import { developer_appsAvgOrderByAggregateInputObjectSchema } from './developer_appsAvgOrderByAggregateInput.schema';
import { developer_appsMaxOrderByAggregateInputObjectSchema } from './developer_appsMaxOrderByAggregateInput.schema';
import { developer_appsMinOrderByAggregateInputObjectSchema } from './developer_appsMinOrderByAggregateInput.schema';
import { developer_appsSumOrderByAggregateInputObjectSchema } from './developer_appsSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.developer_appsOrderByWithAggregationInput> = z
  .object({
    address: z.lazy(() => SortOrderSchema).optional(),
    blockhash: z.lazy(() => SortOrderSchema).optional(),
    blocknumber: z.lazy(() => SortOrderSchema).optional(),
    user_id: z.lazy(() => SortOrderSchema).optional(),
    name: z.lazy(() => SortOrderSchema).optional(),
    is_personal_access: z.lazy(() => SortOrderSchema).optional(),
    is_delete: z.lazy(() => SortOrderSchema).optional(),
    created_at: z.lazy(() => SortOrderSchema).optional(),
    txhash: z.lazy(() => SortOrderSchema).optional(),
    is_current: z.lazy(() => SortOrderSchema).optional(),
    updated_at: z.lazy(() => SortOrderSchema).optional(),
    description: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => developer_appsCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z
      .lazy(() => developer_appsAvgOrderByAggregateInputObjectSchema)
      .optional(),
    _max: z
      .lazy(() => developer_appsMaxOrderByAggregateInputObjectSchema)
      .optional(),
    _min: z
      .lazy(() => developer_appsMinOrderByAggregateInputObjectSchema)
      .optional(),
    _sum: z
      .lazy(() => developer_appsSumOrderByAggregateInputObjectSchema)
      .optional(),
  })
  .strict();

export const developer_appsOrderByWithAggregationInputObjectSchema = Schema;
