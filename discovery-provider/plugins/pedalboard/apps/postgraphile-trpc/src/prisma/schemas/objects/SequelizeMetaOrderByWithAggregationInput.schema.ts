import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { SequelizeMetaCountOrderByAggregateInputObjectSchema } from './SequelizeMetaCountOrderByAggregateInput.schema';
import { SequelizeMetaMaxOrderByAggregateInputObjectSchema } from './SequelizeMetaMaxOrderByAggregateInput.schema';
import { SequelizeMetaMinOrderByAggregateInputObjectSchema } from './SequelizeMetaMinOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.SequelizeMetaOrderByWithAggregationInput> = z
  .object({
    name: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => SequelizeMetaCountOrderByAggregateInputObjectSchema)
      .optional(),
    _max: z
      .lazy(() => SequelizeMetaMaxOrderByAggregateInputObjectSchema)
      .optional(),
    _min: z
      .lazy(() => SequelizeMetaMinOrderByAggregateInputObjectSchema)
      .optional(),
  })
  .strict();

export const SequelizeMetaOrderByWithAggregationInputObjectSchema = Schema;
