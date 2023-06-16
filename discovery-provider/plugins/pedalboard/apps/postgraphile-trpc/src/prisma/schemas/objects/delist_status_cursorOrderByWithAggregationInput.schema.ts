import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { delist_status_cursorCountOrderByAggregateInputObjectSchema } from './delist_status_cursorCountOrderByAggregateInput.schema';
import { delist_status_cursorMaxOrderByAggregateInputObjectSchema } from './delist_status_cursorMaxOrderByAggregateInput.schema';
import { delist_status_cursorMinOrderByAggregateInputObjectSchema } from './delist_status_cursorMinOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.delist_status_cursorOrderByWithAggregationInput> =
  z
    .object({
      host: z.lazy(() => SortOrderSchema).optional(),
      entity: z.lazy(() => SortOrderSchema).optional(),
      created_at: z.lazy(() => SortOrderSchema).optional(),
      _count: z
        .lazy(() => delist_status_cursorCountOrderByAggregateInputObjectSchema)
        .optional(),
      _max: z
        .lazy(() => delist_status_cursorMaxOrderByAggregateInputObjectSchema)
        .optional(),
      _min: z
        .lazy(() => delist_status_cursorMinOrderByAggregateInputObjectSchema)
        .optional(),
    })
    .strict();

export const delist_status_cursorOrderByWithAggregationInputObjectSchema =
  Schema;
