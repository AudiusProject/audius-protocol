import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { playsCountOrderByAggregateInputObjectSchema } from './playsCountOrderByAggregateInput.schema';
import { playsAvgOrderByAggregateInputObjectSchema } from './playsAvgOrderByAggregateInput.schema';
import { playsMaxOrderByAggregateInputObjectSchema } from './playsMaxOrderByAggregateInput.schema';
import { playsMinOrderByAggregateInputObjectSchema } from './playsMinOrderByAggregateInput.schema';
import { playsSumOrderByAggregateInputObjectSchema } from './playsSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.playsOrderByWithAggregationInput> = z
  .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    user_id: z.lazy(() => SortOrderSchema).optional(),
    source: z.lazy(() => SortOrderSchema).optional(),
    play_item_id: z.lazy(() => SortOrderSchema).optional(),
    created_at: z.lazy(() => SortOrderSchema).optional(),
    updated_at: z.lazy(() => SortOrderSchema).optional(),
    slot: z.lazy(() => SortOrderSchema).optional(),
    signature: z.lazy(() => SortOrderSchema).optional(),
    city: z.lazy(() => SortOrderSchema).optional(),
    region: z.lazy(() => SortOrderSchema).optional(),
    country: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => playsCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z.lazy(() => playsAvgOrderByAggregateInputObjectSchema).optional(),
    _max: z.lazy(() => playsMaxOrderByAggregateInputObjectSchema).optional(),
    _min: z.lazy(() => playsMinOrderByAggregateInputObjectSchema).optional(),
    _sum: z.lazy(() => playsSumOrderByAggregateInputObjectSchema).optional(),
  })
  .strict();

export const playsOrderByWithAggregationInputObjectSchema = Schema;
