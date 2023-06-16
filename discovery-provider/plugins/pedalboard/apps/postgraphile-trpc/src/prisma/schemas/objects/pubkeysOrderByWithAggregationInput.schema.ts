import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { pubkeysCountOrderByAggregateInputObjectSchema } from './pubkeysCountOrderByAggregateInput.schema';
import { pubkeysMaxOrderByAggregateInputObjectSchema } from './pubkeysMaxOrderByAggregateInput.schema';
import { pubkeysMinOrderByAggregateInputObjectSchema } from './pubkeysMinOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.pubkeysOrderByWithAggregationInput> = z
  .object({
    wallet: z.lazy(() => SortOrderSchema).optional(),
    pubkey: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => pubkeysCountOrderByAggregateInputObjectSchema)
      .optional(),
    _max: z.lazy(() => pubkeysMaxOrderByAggregateInputObjectSchema).optional(),
    _min: z.lazy(() => pubkeysMinOrderByAggregateInputObjectSchema).optional(),
  })
  .strict();

export const pubkeysOrderByWithAggregationInputObjectSchema = Schema;
