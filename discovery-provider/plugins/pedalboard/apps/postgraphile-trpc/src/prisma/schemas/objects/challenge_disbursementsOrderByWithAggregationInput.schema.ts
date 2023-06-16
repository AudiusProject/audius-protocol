import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';
import { challenge_disbursementsCountOrderByAggregateInputObjectSchema } from './challenge_disbursementsCountOrderByAggregateInput.schema';
import { challenge_disbursementsAvgOrderByAggregateInputObjectSchema } from './challenge_disbursementsAvgOrderByAggregateInput.schema';
import { challenge_disbursementsMaxOrderByAggregateInputObjectSchema } from './challenge_disbursementsMaxOrderByAggregateInput.schema';
import { challenge_disbursementsMinOrderByAggregateInputObjectSchema } from './challenge_disbursementsMinOrderByAggregateInput.schema';
import { challenge_disbursementsSumOrderByAggregateInputObjectSchema } from './challenge_disbursementsSumOrderByAggregateInput.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.challenge_disbursementsOrderByWithAggregationInput> =
  z
    .object({
      challenge_id: z.lazy(() => SortOrderSchema).optional(),
      user_id: z.lazy(() => SortOrderSchema).optional(),
      specifier: z.lazy(() => SortOrderSchema).optional(),
      signature: z.lazy(() => SortOrderSchema).optional(),
      slot: z.lazy(() => SortOrderSchema).optional(),
      amount: z.lazy(() => SortOrderSchema).optional(),
      _count: z
        .lazy(
          () => challenge_disbursementsCountOrderByAggregateInputObjectSchema,
        )
        .optional(),
      _avg: z
        .lazy(() => challenge_disbursementsAvgOrderByAggregateInputObjectSchema)
        .optional(),
      _max: z
        .lazy(() => challenge_disbursementsMaxOrderByAggregateInputObjectSchema)
        .optional(),
      _min: z
        .lazy(() => challenge_disbursementsMinOrderByAggregateInputObjectSchema)
        .optional(),
      _sum: z
        .lazy(() => challenge_disbursementsSumOrderByAggregateInputObjectSchema)
        .optional(),
    })
    .strict();

export const challenge_disbursementsOrderByWithAggregationInputObjectSchema =
  Schema;
