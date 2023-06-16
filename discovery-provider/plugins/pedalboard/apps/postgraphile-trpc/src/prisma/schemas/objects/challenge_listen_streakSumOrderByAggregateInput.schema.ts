import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.challenge_listen_streakSumOrderByAggregateInput> =
  z
    .object({
      user_id: z.lazy(() => SortOrderSchema).optional(),
      listen_streak: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const challenge_listen_streakSumOrderByAggregateInputObjectSchema =
  Schema;
