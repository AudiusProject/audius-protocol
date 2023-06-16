import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { aggregate_monthly_playsCountOrderByAggregateInputObjectSchema } from './aggregate_monthly_playsCountOrderByAggregateInput.schema';
import { aggregate_monthly_playsAvgOrderByAggregateInputObjectSchema } from './aggregate_monthly_playsAvgOrderByAggregateInput.schema';
import { aggregate_monthly_playsMaxOrderByAggregateInputObjectSchema } from './aggregate_monthly_playsMaxOrderByAggregateInput.schema';
import { aggregate_monthly_playsMinOrderByAggregateInputObjectSchema } from './aggregate_monthly_playsMinOrderByAggregateInput.schema';
import { aggregate_monthly_playsSumOrderByAggregateInputObjectSchema } from './aggregate_monthly_playsSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_monthly_playsOrderByWithAggregationInput> =
  z
    .object({
      play_item_id: z.lazy(() => SortOrderSchema).optional(),
      timestamp: z.lazy(() => SortOrderSchema).optional(),
      count: z.lazy(() => SortOrderSchema).optional(),
      _count: z
        .lazy(
          () => aggregate_monthly_playsCountOrderByAggregateInputObjectSchema,
        )
        .optional(),
      _avg: z
        .lazy(() => aggregate_monthly_playsAvgOrderByAggregateInputObjectSchema)
        .optional(),
      _max: z
        .lazy(() => aggregate_monthly_playsMaxOrderByAggregateInputObjectSchema)
        .optional(),
      _min: z
        .lazy(() => aggregate_monthly_playsMinOrderByAggregateInputObjectSchema)
        .optional(),
      _sum: z
        .lazy(() => aggregate_monthly_playsSumOrderByAggregateInputObjectSchema)
        .optional(),
    })
    .strict();

export const aggregate_monthly_playsOrderByWithAggregationInputObjectSchema =
  Schema;
