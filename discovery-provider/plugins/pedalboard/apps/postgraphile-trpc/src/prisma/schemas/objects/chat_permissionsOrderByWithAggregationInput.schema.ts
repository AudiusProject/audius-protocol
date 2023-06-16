import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { chat_permissionsCountOrderByAggregateInputObjectSchema } from './chat_permissionsCountOrderByAggregateInput.schema';
import { chat_permissionsAvgOrderByAggregateInputObjectSchema } from './chat_permissionsAvgOrderByAggregateInput.schema';
import { chat_permissionsMaxOrderByAggregateInputObjectSchema } from './chat_permissionsMaxOrderByAggregateInput.schema';
import { chat_permissionsMinOrderByAggregateInputObjectSchema } from './chat_permissionsMinOrderByAggregateInput.schema';
import { chat_permissionsSumOrderByAggregateInputObjectSchema } from './chat_permissionsSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.chat_permissionsOrderByWithAggregationInput> = z
  .object({
    user_id: z.lazy(() => SortOrderSchema).optional(),
    permits: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => chat_permissionsCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z
      .lazy(() => chat_permissionsAvgOrderByAggregateInputObjectSchema)
      .optional(),
    _max: z
      .lazy(() => chat_permissionsMaxOrderByAggregateInputObjectSchema)
      .optional(),
    _min: z
      .lazy(() => chat_permissionsMinOrderByAggregateInputObjectSchema)
      .optional(),
    _sum: z
      .lazy(() => chat_permissionsSumOrderByAggregateInputObjectSchema)
      .optional(),
  })
  .strict();

export const chat_permissionsOrderByWithAggregationInputObjectSchema = Schema;
