import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { chatCountOrderByAggregateInputObjectSchema } from './chatCountOrderByAggregateInput.schema';
import { chatMaxOrderByAggregateInputObjectSchema } from './chatMaxOrderByAggregateInput.schema';
import { chatMinOrderByAggregateInputObjectSchema } from './chatMinOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chatOrderByWithAggregationInput> = z
  .object({
    chat_id: z.lazy(() => SortOrderSchema).optional(),
    created_at: z.lazy(() => SortOrderSchema).optional(),
    last_message_at: z.lazy(() => SortOrderSchema).optional(),
    last_message: z.lazy(() => SortOrderSchema).optional(),
    _count: z.lazy(() => chatCountOrderByAggregateInputObjectSchema).optional(),
    _max: z.lazy(() => chatMaxOrderByAggregateInputObjectSchema).optional(),
    _min: z.lazy(() => chatMinOrderByAggregateInputObjectSchema).optional(),
  })
  .strict();

export const chatOrderByWithAggregationInputObjectSchema = Schema;
