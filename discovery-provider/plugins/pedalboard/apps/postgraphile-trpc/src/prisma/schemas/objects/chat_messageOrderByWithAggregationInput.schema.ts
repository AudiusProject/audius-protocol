import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { chat_messageCountOrderByAggregateInputObjectSchema } from './chat_messageCountOrderByAggregateInput.schema';
import { chat_messageAvgOrderByAggregateInputObjectSchema } from './chat_messageAvgOrderByAggregateInput.schema';
import { chat_messageMaxOrderByAggregateInputObjectSchema } from './chat_messageMaxOrderByAggregateInput.schema';
import { chat_messageMinOrderByAggregateInputObjectSchema } from './chat_messageMinOrderByAggregateInput.schema';
import { chat_messageSumOrderByAggregateInputObjectSchema } from './chat_messageSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_messageOrderByWithAggregationInput> = z
  .object({
    message_id: z.lazy(() => SortOrderSchema).optional(),
    chat_id: z.lazy(() => SortOrderSchema).optional(),
    user_id: z.lazy(() => SortOrderSchema).optional(),
    created_at: z.lazy(() => SortOrderSchema).optional(),
    ciphertext: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => chat_messageCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z
      .lazy(() => chat_messageAvgOrderByAggregateInputObjectSchema)
      .optional(),
    _max: z
      .lazy(() => chat_messageMaxOrderByAggregateInputObjectSchema)
      .optional(),
    _min: z
      .lazy(() => chat_messageMinOrderByAggregateInputObjectSchema)
      .optional(),
    _sum: z
      .lazy(() => chat_messageSumOrderByAggregateInputObjectSchema)
      .optional(),
  })
  .strict();

export const chat_messageOrderByWithAggregationInputObjectSchema = Schema;
