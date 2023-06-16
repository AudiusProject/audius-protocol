import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { cid_dataCountOrderByAggregateInputObjectSchema } from './cid_dataCountOrderByAggregateInput.schema';
import { cid_dataMaxOrderByAggregateInputObjectSchema } from './cid_dataMaxOrderByAggregateInput.schema';
import { cid_dataMinOrderByAggregateInputObjectSchema } from './cid_dataMinOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.cid_dataOrderByWithAggregationInput> = z
  .object({
    cid: z.lazy(() => SortOrderSchema).optional(),
    type: z.lazy(() => SortOrderSchema).optional(),
    data: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => cid_dataCountOrderByAggregateInputObjectSchema)
      .optional(),
    _max: z.lazy(() => cid_dataMaxOrderByAggregateInputObjectSchema).optional(),
    _min: z.lazy(() => cid_dataMinOrderByAggregateInputObjectSchema).optional(),
  })
  .strict();

export const cid_dataOrderByWithAggregationInputObjectSchema = Schema;
