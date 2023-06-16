import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { aggregate_playsCountOrderByAggregateInputObjectSchema } from './aggregate_playsCountOrderByAggregateInput.schema';
import { aggregate_playsAvgOrderByAggregateInputObjectSchema } from './aggregate_playsAvgOrderByAggregateInput.schema';
import { aggregate_playsMaxOrderByAggregateInputObjectSchema } from './aggregate_playsMaxOrderByAggregateInput.schema';
import { aggregate_playsMinOrderByAggregateInputObjectSchema } from './aggregate_playsMinOrderByAggregateInput.schema';
import { aggregate_playsSumOrderByAggregateInputObjectSchema } from './aggregate_playsSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_playsOrderByWithAggregationInput> = z
  .object({
    play_item_id: z.lazy(() => SortOrderSchema).optional(),
    count: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => aggregate_playsCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z
      .lazy(() => aggregate_playsAvgOrderByAggregateInputObjectSchema)
      .optional(),
    _max: z
      .lazy(() => aggregate_playsMaxOrderByAggregateInputObjectSchema)
      .optional(),
    _min: z
      .lazy(() => aggregate_playsMinOrderByAggregateInputObjectSchema)
      .optional(),
    _sum: z
      .lazy(() => aggregate_playsSumOrderByAggregateInputObjectSchema)
      .optional(),
  })
  .strict();

export const aggregate_playsOrderByWithAggregationInputObjectSchema = Schema;
