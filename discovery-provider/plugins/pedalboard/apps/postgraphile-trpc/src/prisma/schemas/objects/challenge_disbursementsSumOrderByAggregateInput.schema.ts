import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.challenge_disbursementsSumOrderByAggregateInput> =
  z
    .object({
      user_id: z.lazy(() => SortOrderSchema).optional(),
      slot: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const challenge_disbursementsSumOrderByAggregateInputObjectSchema =
  Schema;
