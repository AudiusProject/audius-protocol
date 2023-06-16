import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { chat_message_reactionsCountOrderByAggregateInputObjectSchema } from './chat_message_reactionsCountOrderByAggregateInput.schema';
import { chat_message_reactionsAvgOrderByAggregateInputObjectSchema } from './chat_message_reactionsAvgOrderByAggregateInput.schema';
import { chat_message_reactionsMaxOrderByAggregateInputObjectSchema } from './chat_message_reactionsMaxOrderByAggregateInput.schema';
import { chat_message_reactionsMinOrderByAggregateInputObjectSchema } from './chat_message_reactionsMinOrderByAggregateInput.schema';
import { chat_message_reactionsSumOrderByAggregateInputObjectSchema } from './chat_message_reactionsSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_message_reactionsOrderByWithAggregationInput> =
  z
    .object({
      user_id: z.lazy(() => SortOrderSchema).optional(),
      message_id: z.lazy(() => SortOrderSchema).optional(),
      reaction: z.lazy(() => SortOrderSchema).optional(),
      created_at: z.lazy(() => SortOrderSchema).optional(),
      updated_at: z.lazy(() => SortOrderSchema).optional(),
      _count: z
        .lazy(
          () => chat_message_reactionsCountOrderByAggregateInputObjectSchema,
        )
        .optional(),
      _avg: z
        .lazy(() => chat_message_reactionsAvgOrderByAggregateInputObjectSchema)
        .optional(),
      _max: z
        .lazy(() => chat_message_reactionsMaxOrderByAggregateInputObjectSchema)
        .optional(),
      _min: z
        .lazy(() => chat_message_reactionsMinOrderByAggregateInputObjectSchema)
        .optional(),
      _sum: z
        .lazy(() => chat_message_reactionsSumOrderByAggregateInputObjectSchema)
        .optional(),
    })
    .strict();

export const chat_message_reactionsOrderByWithAggregationInputObjectSchema =
  Schema;
