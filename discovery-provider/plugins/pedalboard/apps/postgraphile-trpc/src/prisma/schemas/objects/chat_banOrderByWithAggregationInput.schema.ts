import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { chat_banCountOrderByAggregateInputObjectSchema } from './chat_banCountOrderByAggregateInput.schema';
import { chat_banAvgOrderByAggregateInputObjectSchema } from './chat_banAvgOrderByAggregateInput.schema';
import { chat_banMaxOrderByAggregateInputObjectSchema } from './chat_banMaxOrderByAggregateInput.schema';
import { chat_banMinOrderByAggregateInputObjectSchema } from './chat_banMinOrderByAggregateInput.schema';
import { chat_banSumOrderByAggregateInputObjectSchema } from './chat_banSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_banOrderByWithAggregationInput> = z
  .object({
    user_id: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => chat_banCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z.lazy(() => chat_banAvgOrderByAggregateInputObjectSchema).optional(),
    _max: z.lazy(() => chat_banMaxOrderByAggregateInputObjectSchema).optional(),
    _min: z.lazy(() => chat_banMinOrderByAggregateInputObjectSchema).optional(),
    _sum: z.lazy(() => chat_banSumOrderByAggregateInputObjectSchema).optional(),
  })
  .strict();

export const chat_banOrderByWithAggregationInputObjectSchema = Schema;
