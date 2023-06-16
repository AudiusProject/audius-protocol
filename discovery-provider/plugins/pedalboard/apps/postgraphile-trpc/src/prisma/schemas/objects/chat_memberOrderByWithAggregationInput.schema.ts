import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { chat_memberCountOrderByAggregateInputObjectSchema } from './chat_memberCountOrderByAggregateInput.schema';
import { chat_memberAvgOrderByAggregateInputObjectSchema } from './chat_memberAvgOrderByAggregateInput.schema';
import { chat_memberMaxOrderByAggregateInputObjectSchema } from './chat_memberMaxOrderByAggregateInput.schema';
import { chat_memberMinOrderByAggregateInputObjectSchema } from './chat_memberMinOrderByAggregateInput.schema';
import { chat_memberSumOrderByAggregateInputObjectSchema } from './chat_memberSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_memberOrderByWithAggregationInput> = z
  .object({
    chat_id: z.lazy(() => SortOrderSchema).optional(),
    user_id: z.lazy(() => SortOrderSchema).optional(),
    cleared_history_at: z.lazy(() => SortOrderSchema).optional(),
    invited_by_user_id: z.lazy(() => SortOrderSchema).optional(),
    invite_code: z.lazy(() => SortOrderSchema).optional(),
    last_active_at: z.lazy(() => SortOrderSchema).optional(),
    unread_count: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => chat_memberCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z
      .lazy(() => chat_memberAvgOrderByAggregateInputObjectSchema)
      .optional(),
    _max: z
      .lazy(() => chat_memberMaxOrderByAggregateInputObjectSchema)
      .optional(),
    _min: z
      .lazy(() => chat_memberMinOrderByAggregateInputObjectSchema)
      .optional(),
    _sum: z
      .lazy(() => chat_memberSumOrderByAggregateInputObjectSchema)
      .optional(),
  })
  .strict();

export const chat_memberOrderByWithAggregationInputObjectSchema = Schema;
