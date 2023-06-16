import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { chat_blocked_usersCountOrderByAggregateInputObjectSchema } from './chat_blocked_usersCountOrderByAggregateInput.schema';
import { chat_blocked_usersAvgOrderByAggregateInputObjectSchema } from './chat_blocked_usersAvgOrderByAggregateInput.schema';
import { chat_blocked_usersMaxOrderByAggregateInputObjectSchema } from './chat_blocked_usersMaxOrderByAggregateInput.schema';
import { chat_blocked_usersMinOrderByAggregateInputObjectSchema } from './chat_blocked_usersMinOrderByAggregateInput.schema';
import { chat_blocked_usersSumOrderByAggregateInputObjectSchema } from './chat_blocked_usersSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_blocked_usersOrderByWithAggregationInput> =
  z
    .object({
      blocker_user_id: z.lazy(() => SortOrderSchema).optional(),
      blockee_user_id: z.lazy(() => SortOrderSchema).optional(),
      created_at: z.lazy(() => SortOrderSchema).optional(),
      _count: z
        .lazy(() => chat_blocked_usersCountOrderByAggregateInputObjectSchema)
        .optional(),
      _avg: z
        .lazy(() => chat_blocked_usersAvgOrderByAggregateInputObjectSchema)
        .optional(),
      _max: z
        .lazy(() => chat_blocked_usersMaxOrderByAggregateInputObjectSchema)
        .optional(),
      _min: z
        .lazy(() => chat_blocked_usersMinOrderByAggregateInputObjectSchema)
        .optional(),
      _sum: z
        .lazy(() => chat_blocked_usersSumOrderByAggregateInputObjectSchema)
        .optional(),
    })
    .strict();

export const chat_blocked_usersOrderByWithAggregationInputObjectSchema = Schema;
