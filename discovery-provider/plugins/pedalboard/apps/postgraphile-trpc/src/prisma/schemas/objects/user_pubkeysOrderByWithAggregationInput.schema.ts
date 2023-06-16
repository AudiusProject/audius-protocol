import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { user_pubkeysCountOrderByAggregateInputObjectSchema } from './user_pubkeysCountOrderByAggregateInput.schema';
import { user_pubkeysAvgOrderByAggregateInputObjectSchema } from './user_pubkeysAvgOrderByAggregateInput.schema';
import { user_pubkeysMaxOrderByAggregateInputObjectSchema } from './user_pubkeysMaxOrderByAggregateInput.schema';
import { user_pubkeysMinOrderByAggregateInputObjectSchema } from './user_pubkeysMinOrderByAggregateInput.schema';
import { user_pubkeysSumOrderByAggregateInputObjectSchema } from './user_pubkeysSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.user_pubkeysOrderByWithAggregationInput> = z
  .object({
    user_id: z.lazy(() => SortOrderSchema).optional(),
    pubkey_base64: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => user_pubkeysCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z
      .lazy(() => user_pubkeysAvgOrderByAggregateInputObjectSchema)
      .optional(),
    _max: z
      .lazy(() => user_pubkeysMaxOrderByAggregateInputObjectSchema)
      .optional(),
    _min: z
      .lazy(() => user_pubkeysMinOrderByAggregateInputObjectSchema)
      .optional(),
    _sum: z
      .lazy(() => user_pubkeysSumOrderByAggregateInputObjectSchema)
      .optional(),
  })
  .strict();

export const user_pubkeysOrderByWithAggregationInputObjectSchema = Schema;
