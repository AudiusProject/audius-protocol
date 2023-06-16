import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { challenge_profile_completionCountOrderByAggregateInputObjectSchema } from './challenge_profile_completionCountOrderByAggregateInput.schema';
import { challenge_profile_completionAvgOrderByAggregateInputObjectSchema } from './challenge_profile_completionAvgOrderByAggregateInput.schema';
import { challenge_profile_completionMaxOrderByAggregateInputObjectSchema } from './challenge_profile_completionMaxOrderByAggregateInput.schema';
import { challenge_profile_completionMinOrderByAggregateInputObjectSchema } from './challenge_profile_completionMinOrderByAggregateInput.schema';
import { challenge_profile_completionSumOrderByAggregateInputObjectSchema } from './challenge_profile_completionSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.challenge_profile_completionOrderByWithAggregationInput> =
  z
    .object({
      user_id: z.lazy(() => SortOrderSchema).optional(),
      profile_description: z.lazy(() => SortOrderSchema).optional(),
      profile_name: z.lazy(() => SortOrderSchema).optional(),
      profile_picture: z.lazy(() => SortOrderSchema).optional(),
      profile_cover_photo: z.lazy(() => SortOrderSchema).optional(),
      follows: z.lazy(() => SortOrderSchema).optional(),
      favorites: z.lazy(() => SortOrderSchema).optional(),
      reposts: z.lazy(() => SortOrderSchema).optional(),
      _count: z
        .lazy(
          () =>
            challenge_profile_completionCountOrderByAggregateInputObjectSchema,
        )
        .optional(),
      _avg: z
        .lazy(
          () =>
            challenge_profile_completionAvgOrderByAggregateInputObjectSchema,
        )
        .optional(),
      _max: z
        .lazy(
          () =>
            challenge_profile_completionMaxOrderByAggregateInputObjectSchema,
        )
        .optional(),
      _min: z
        .lazy(
          () =>
            challenge_profile_completionMinOrderByAggregateInputObjectSchema,
        )
        .optional(),
      _sum: z
        .lazy(
          () =>
            challenge_profile_completionSumOrderByAggregateInputObjectSchema,
        )
        .optional(),
    })
    .strict();

export const challenge_profile_completionOrderByWithAggregationInputObjectSchema =
  Schema;
