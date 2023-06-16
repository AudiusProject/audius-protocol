import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { reactionsCountOrderByAggregateInputObjectSchema } from './reactionsCountOrderByAggregateInput.schema';
import { reactionsAvgOrderByAggregateInputObjectSchema } from './reactionsAvgOrderByAggregateInput.schema';
import { reactionsMaxOrderByAggregateInputObjectSchema } from './reactionsMaxOrderByAggregateInput.schema';
import { reactionsMinOrderByAggregateInputObjectSchema } from './reactionsMinOrderByAggregateInput.schema';
import { reactionsSumOrderByAggregateInputObjectSchema } from './reactionsSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.reactionsOrderByWithAggregationInput> = z
  .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    slot: z.lazy(() => SortOrderSchema).optional(),
    reaction_value: z.lazy(() => SortOrderSchema).optional(),
    sender_wallet: z.lazy(() => SortOrderSchema).optional(),
    reaction_type: z.lazy(() => SortOrderSchema).optional(),
    reacted_to: z.lazy(() => SortOrderSchema).optional(),
    timestamp: z.lazy(() => SortOrderSchema).optional(),
    tx_signature: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => reactionsCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z
      .lazy(() => reactionsAvgOrderByAggregateInputObjectSchema)
      .optional(),
    _max: z
      .lazy(() => reactionsMaxOrderByAggregateInputObjectSchema)
      .optional(),
    _min: z
      .lazy(() => reactionsMinOrderByAggregateInputObjectSchema)
      .optional(),
    _sum: z
      .lazy(() => reactionsSumOrderByAggregateInputObjectSchema)
      .optional(),
  })
  .strict();

export const reactionsOrderByWithAggregationInputObjectSchema = Schema;
