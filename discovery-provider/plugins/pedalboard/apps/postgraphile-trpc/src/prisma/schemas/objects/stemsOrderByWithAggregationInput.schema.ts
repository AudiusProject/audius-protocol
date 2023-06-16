import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { stemsCountOrderByAggregateInputObjectSchema } from './stemsCountOrderByAggregateInput.schema';
import { stemsAvgOrderByAggregateInputObjectSchema } from './stemsAvgOrderByAggregateInput.schema';
import { stemsMaxOrderByAggregateInputObjectSchema } from './stemsMaxOrderByAggregateInput.schema';
import { stemsMinOrderByAggregateInputObjectSchema } from './stemsMinOrderByAggregateInput.schema';
import { stemsSumOrderByAggregateInputObjectSchema } from './stemsSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.stemsOrderByWithAggregationInput> = z
  .object({
    parent_track_id: z.lazy(() => SortOrderSchema).optional(),
    child_track_id: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => stemsCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z.lazy(() => stemsAvgOrderByAggregateInputObjectSchema).optional(),
    _max: z.lazy(() => stemsMaxOrderByAggregateInputObjectSchema).optional(),
    _min: z.lazy(() => stemsMinOrderByAggregateInputObjectSchema).optional(),
    _sum: z.lazy(() => stemsSumOrderByAggregateInputObjectSchema).optional(),
  })
  .strict();

export const stemsOrderByWithAggregationInputObjectSchema = Schema;
