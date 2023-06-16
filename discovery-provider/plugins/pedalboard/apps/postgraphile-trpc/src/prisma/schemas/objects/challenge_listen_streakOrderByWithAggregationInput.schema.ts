import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { challenge_listen_streakCountOrderByAggregateInputObjectSchema } from './challenge_listen_streakCountOrderByAggregateInput.schema';
import { challenge_listen_streakAvgOrderByAggregateInputObjectSchema } from './challenge_listen_streakAvgOrderByAggregateInput.schema';
import { challenge_listen_streakMaxOrderByAggregateInputObjectSchema } from './challenge_listen_streakMaxOrderByAggregateInput.schema';
import { challenge_listen_streakMinOrderByAggregateInputObjectSchema } from './challenge_listen_streakMinOrderByAggregateInput.schema';
import { challenge_listen_streakSumOrderByAggregateInputObjectSchema } from './challenge_listen_streakSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.challenge_listen_streakOrderByWithAggregationInput> =
  z
    .object({
      user_id: z.lazy(() => SortOrderSchema).optional(),
      last_listen_date: z.lazy(() => SortOrderSchema).optional(),
      listen_streak: z.lazy(() => SortOrderSchema).optional(),
      _count: z
        .lazy(
          () => challenge_listen_streakCountOrderByAggregateInputObjectSchema,
        )
        .optional(),
      _avg: z
        .lazy(() => challenge_listen_streakAvgOrderByAggregateInputObjectSchema)
        .optional(),
      _max: z
        .lazy(() => challenge_listen_streakMaxOrderByAggregateInputObjectSchema)
        .optional(),
      _min: z
        .lazy(() => challenge_listen_streakMinOrderByAggregateInputObjectSchema)
        .optional(),
      _sum: z
        .lazy(() => challenge_listen_streakSumOrderByAggregateInputObjectSchema)
        .optional(),
    })
    .strict();

export const challenge_listen_streakOrderByWithAggregationInputObjectSchema =
  Schema;
