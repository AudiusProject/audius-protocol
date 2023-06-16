import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { savesCountOrderByAggregateInputObjectSchema } from './savesCountOrderByAggregateInput.schema';
import { savesAvgOrderByAggregateInputObjectSchema } from './savesAvgOrderByAggregateInput.schema';
import { savesMaxOrderByAggregateInputObjectSchema } from './savesMaxOrderByAggregateInput.schema';
import { savesMinOrderByAggregateInputObjectSchema } from './savesMinOrderByAggregateInput.schema';
import { savesSumOrderByAggregateInputObjectSchema } from './savesSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.savesOrderByWithAggregationInput> = z
  .object({
    blockhash: z.lazy(() => SortOrderSchema).optional(),
    blocknumber: z.lazy(() => SortOrderSchema).optional(),
    user_id: z.lazy(() => SortOrderSchema).optional(),
    save_item_id: z.lazy(() => SortOrderSchema).optional(),
    save_type: z.lazy(() => SortOrderSchema).optional(),
    is_current: z.lazy(() => SortOrderSchema).optional(),
    is_delete: z.lazy(() => SortOrderSchema).optional(),
    created_at: z.lazy(() => SortOrderSchema).optional(),
    txhash: z.lazy(() => SortOrderSchema).optional(),
    slot: z.lazy(() => SortOrderSchema).optional(),
    is_save_of_repost: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => savesCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z.lazy(() => savesAvgOrderByAggregateInputObjectSchema).optional(),
    _max: z.lazy(() => savesMaxOrderByAggregateInputObjectSchema).optional(),
    _min: z.lazy(() => savesMinOrderByAggregateInputObjectSchema).optional(),
    _sum: z.lazy(() => savesSumOrderByAggregateInputObjectSchema).optional(),
  })
  .strict();

export const savesOrderByWithAggregationInputObjectSchema = Schema;
