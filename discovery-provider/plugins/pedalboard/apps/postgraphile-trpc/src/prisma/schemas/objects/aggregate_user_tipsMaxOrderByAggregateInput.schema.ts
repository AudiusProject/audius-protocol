import { z } from 'zod';
import { SortOrderSchema } from '../enums/SortOrder.schema';

import type { Prisma } from '@prisma/client';

const Schema: z.ZodType<Prisma.aggregate_user_tipsMaxOrderByAggregateInput> = z
  .object({
    sender_user_id: z.lazy(() => SortOrderSchema).optional(),
    receiver_user_id: z.lazy(() => SortOrderSchema).optional(),
    amount: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict();

export const aggregate_user_tipsMaxOrderByAggregateInputObjectSchema = Schema;
